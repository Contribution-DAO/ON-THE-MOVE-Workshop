# Walrus x Seal — Secret Message Workshop

## Step 1: ติดตั้ง Dependencies

```bash
cd walrus-seal
npm install
```

---

## Step 2: ตั้งค่า Environment

copy ไฟล์ `.env.example` เป็น `.env`:

```bash
cp .env.example .env
```

แล้วแก้ไขไฟล์ `.env`:

```env
SENDER_PRIVATE_KEY=suiprivkey1...ใส่_private_key_ของผู้ส่ง
RECEIVER_PRIVATE_KEY=suiprivkey1...ใส่_private_key_ของผู้รับ
NETWORK=testnet
PACKAGE_ID=0x04c285b7f84f9db5cbef6e3c0a48a086463fa618a45ddc14154179fbde533c34
```

> ต้องใช้ **2 address** (ผู้ส่ง + ผู้รับ) เพื่อจำลองการส่งข้อความลับระหว่างกัน

> `PACKAGE_ID` ที่ให้มาคือ contract ที่ deploy ไว้แล้วบน testnet ใช้ได้เลย หรือจะ deploy เองก็ได้ (ดู Step 3)

---

## Step 3: Export Private Key จาก SUI CLI

ถ้ายังไม่มี private key ให้ export จาก SUI CLI:

```bash
sui client addresses
sui keytool export --key-identity <SUI_ADDRESS>
```

จะได้ค่า `suiprivkey1...` ออกมา ทำซ้ำ 2 ครั้งสำหรับ address ผู้ส่งและผู้รับ

> ดูรายละเอียดเพิ่มเติมได้ที่ [`export-sui-key.md`](./export-sui-key.md)

---

## Step 4: (ถ้าจะ Deploy เอง) สร้างและ Publish Smart Contract

ถ้าใช้ `PACKAGE_ID` ที่ให้มาใน `.env.example` ข้ามไป **Step 5** ได้เลย

แต่ถ้าอยากลอง deploy เอง:

```bash
sui move new secret_message
cd secret_message
```

copy ไฟล์ [`secret_message.move`](./secret_message.move) ไปวางที่ `sources/secret_message.move` แล้ว:

```bash
sui move build
sui client publish --gas-budget 100000000
```

เอา **Package ID** ที่ได้ไปแทนค่าใน `.env` ที่ `PACKAGE_ID`

---

## Step 5: ทำความเข้าใจโครงสร้างโค้ด

```
walrus-seal/
├── main.ts               ← script หลัก (รันทั้ง sender + receiver flow)
├── secret_message.move   ← smart contract (access control policy)
├── lib/
│   ├── env.ts            ← config + Seal Key Servers + Walrus endpoints
│   └── walrus.ts         ← helper upload/download blob จาก Walrus
├── package.json
├── tsconfig.json
└── .env.example
```

**แต่ละไฟล์ทำอะไร:**

- **`main.ts`** — script หลักที่รัน flow ทั้งหมด ตั้งแต่ encrypt, upload, สร้าง policy, download, decrypt
- **`secret_message.move`** — smart contract ที่ทำหน้าที่เป็น access control policy กำหนดว่าใครมีสิทธิ์อ่านข้อความ
- **`lib/env.ts`** — โหลด config จาก `.env` รวมถึง Seal Key Servers และ Walrus endpoints (publishers + aggregators)
- **`lib/walrus.ts`** — helper สำหรับ upload/download ข้อมูลที่เข้ารหัสแล้วไป/กลับจาก Walrus

---

## Step 6: ทำความเข้าใจ Smart Contract

ไฟล์ `secret_message.move` มี 2 ส่วนหลัก:

### SecretMessage (Policy Object)

```
SecretMessage {
    id:             UID      ← ID ของ object
    sender:         address  ← address ผู้ส่ง
    recipient:      address  ← address ผู้รับ (คนที่มีสิทธิ์อ่าน)
    walrus_blob_id: String   ← ID ของข้อมูลที่เข้ารหัสแล้วบน Walrus
}
```

> ตัวข้อความจริงไม่ได้เก็บบน chain — เก็บบน Walrus ในรูปแบบที่เข้ารหัสแล้ว

### create_secret_message()

สร้าง policy object แล้วส่งให้ผู้รับ เพื่อให้ผู้รับถือ object นี้ไว้เป็นหลักฐานว่ามีสิทธิ์ถอดรหัส

### seal_approve()

ฟังก์ชันที่ Seal Key Servers จะเรียกเพื่อตรวจสอบสิทธิ์ — ถ้า `ctx.sender()` เป็น `recipient` ตัวจริงก็ผ่าน ถ้าไม่ใช่ก็ error `ENoAccess`

---

## Step 7: รัน Demo

```bash
npm run main
```

หรือ:

```bash
npx tsx main.ts
```

script จะรัน flow ทั้งหมดให้อัตโนมัติ แบ่งเป็น 2 ฝั่ง:

### Sender Flow (ผู้ส่ง)

1. **Encrypt** — เข้ารหัสข้อความด้วย Seal client (threshold 2-of-2)
2. **Upload** — อัพโหลดข้อมูลที่เข้ารหัสแล้วขึ้น Walrus ได้ `blobId` กลับมา
3. **Mint Policy** — สร้าง `SecretMessage` object บน chain ระบุ `recipient` กับ `blobId`

### Receiver Flow (ผู้รับ)

4. **Fetch Policy** — ดึง `SecretMessage` object จาก chain เพื่อเอา `walrus_blob_id`
5. **Download** — ดาวน์โหลดข้อมูลที่เข้ารหัสจาก Walrus
6. **Session Key** — สร้าง ephemeral session key สำหรับพิสูจน์ตัวตน
7. **Build Proof** — สร้าง transaction ที่เรียก `seal_approve` เป็น proof ส่งให้ Key Servers
8. **Decrypt** — Seal Key Servers ตรวจสอบสิทธิ์ แล้วช่วยถอดรหัสข้อความ

### ผลลัพธ์ที่ควรเห็น

```
👤 Sender:   0x...
👤 Receiver: 0x...

--- [Step 1] Sender Turn ---
🔒 Encrypting payload...
-> Encrypted size: xxx bytes
☁️  Trying upload to: https://publisher.walrus-testnet.walrus.space...
Walrus Blob ID: ...
⛓️ Minting SecretMessage object on-chain...
Policy Object created: 0x...

⏳ Chilling for 5s to let Walrus propagate...

--- [Step 2] Receiver Turn ---
Fetching policy object: 0x...
Found Walrus ID: ...
⬇️  Trying download from: https://aggregator.walrus-testnet.walrus.space...
-> Got xxx bytes
Generating temp session key...
Building auth proof...
Asking Key Servers to decrypt...
SUCCESS! Message: "Yo fam, this is exclusive content! 📸 (Secured by Seal)"

✨ Boom! Mission accomplished.
```

> ถ้าอยากเปลี่ยนข้อความลับ แก้ค่า `secretMessage` ในไฟล์ [`main.ts`](./main.ts) บรรทัดที่ 28-29

---

## สรุป Flow ทั้งหมด

```
Sender                              Receiver
  │                                    │
  ├─ 1. Encrypt ข้อความ (Seal)         │
  ├─ 2. Upload ขึ้น Walrus             │
  ├─ 3. สร้าง Policy Object on-chain  │
  │         │                          │
  │         └─── ส่ง Policy Object ──► │
  │                                    ├─ 4. ดึง Policy + blobId จาก chain
  │                                    ├─ 5. Download จาก Walrus
  │                                    ├─ 6. สร้าง Session Key
  │                                    ├─ 7. Build Proof (seal_approve)
  │                                    └─ 8. Decrypt ผ่าน Key Servers
  │                                    │
  │                                    ▼
  │                              อ่านข้อความลับได้!
```

---

## เพิ่มเติม

- Smart Contract: [`secret_message.move`](./secret_message.move)
- Slide: [`walrus.pdf`](./walrus.pdf)
- Export Key Guide: [`export-sui-key.md`](./export-sui-key.md)
- Facebook Group: https://www.facebook.com/groups/onthemoveth
- X (Twitter): https://x.com/onthemoveth

มีคำถามหรือติดปัญหาตรงไหน ถามได้เลยในกลุ่ม **ON THE MOVE** ครับ!
