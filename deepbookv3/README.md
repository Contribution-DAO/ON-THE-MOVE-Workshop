# DeepBook V3 — DeFi Workshop

## Step 1: ติดตั้ง Dependencies

```bash
cd deepbookv3
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
SUI_PRIVATE_KEY=suiprivkey1...ใส่_private_key_ตรงนี้
NETWORK=testnet
BALANCE_MANAGER_KEY=
BALANCE_MANAGER_ID=
```

> `BALANCE_MANAGER_KEY` กับ `BALANCE_MANAGER_ID` ยังไม่ต้องใส่ เดี๋ยวเราจะสร้างกันใน Step ถัดไป

---

## Step 3: Export Private Key จาก SUI CLI

ถ้ายังไม่มี private key ให้ export จาก SUI CLI:

```bash
sui keytool export --key-identity <SUI_ADDRESS>
```

จะได้ค่า `suiprivkey1...` ออกมา เอาไปใส่ใน `.env` ที่ `SUI_PRIVATE_KEY`

> ดูรายละเอียดเพิ่มเติมได้ที่ [`export-sui-key.md`](../walrus-seal/export-sui-key.md)

---

## Step 4: ทำความเข้าใจโครงสร้างโค้ด

```
deepbookv3/
├── lib/
│   ├── env.ts        ← โหลดค่า config จาก .env
│   ├── sui.ts        ← สร้าง keypair จาก private key
│   ├── deepbook.ts   ← สร้าง DeepBook client
│   └── tx.ts         ← helper สำหรับ build และ execute transaction
├── example/
│   ├── balanceManager.create.ts  ← สร้าง Balance Manager
│   ├── depositSui.ts             ← ฝาก SUI เข้า Balance Manager
│   ├── readManagerBalances.ts    ← เช็คยอดเงิน
│   ├── limitOrder.ts             ← วาง Limit Order
│   ├── marketOrder.ts            ← วาง Market Order
│   ├── swapOrder.ts              ← Swap token
│   ├── cancelOrder.ts            ← ยกเลิก Order ทั้งหมด
│   └── withdraw.ts              ← ถอนเงินออกจาก Balance Manager
├── package.json
├── tsconfig.json
└── .env.example
```

**lib/ — แต่ละไฟล์ทำอะไร:**

- **`env.ts`** — อ่านค่า config จากไฟล์ `.env` เช่น private key, network, balance manager
- **`sui.ts`** — แปลง private key เป็น keypair สำหรับ sign transaction
- **`deepbook.ts`** — สร้าง DeepBook client ที่เชื่อมต่อกับ SUI network พร้อม DeepBook V3 extension
- **`tx.ts`** — helper function `runTx()` ที่ช่วย build, sign, execute transaction ให้สะดวกขึ้น

---

## Step 5: สร้าง Balance Manager

Balance Manager คือ object บน chain ที่ใช้จัดการเงินสำหรับเทรดบน DeepBook ต้องสร้างตัวนี้ก่อนถึงจะเทรดได้

```bash
npx tsx example/balanceManager.create.ts
```

ตัว script จะเรียก `client.deepbook.balanceManager.createAndShareBalanceManager()` สร้าง Balance Manager แล้ว share ให้ใช้งานได้

เมื่อสำเร็จ จะเห็น result ให้มองหา **Balance Manager Object ID** แล้วเอาไปใส่ใน `.env`:

```env
BALANCE_MANAGER_KEY=BM1
BALANCE_MANAGER_ID=0x...ใส่_balance_manager_id_ตรงนี้
```

> หลังจาก Step นี้ ทุก Step ถัดไปจะใช้ Balance Manager ID ที่เราตั้งไว้

---

## Step 6: ฝาก SUI เข้า Balance Manager

ก่อนจะเทรดได้ ต้องฝากเงินเข้า Balance Manager ก่อน

```bash
npx tsx example/depositSui.ts
```

ตัว script จะฝาก SUI จำนวน **20 SUI** เข้า Balance Manager ผ่าน `client.deepbook.balanceManager.depositIntoManager()`

> ถ้าอยากเปลี่ยนจำนวน แก้ค่า `amountSui` ในไฟล์ [`example/depositSui.ts`](./example/depositSui.ts) ได้เลย

---

## Step 7: เช็คยอดเงินใน Balance Manager

```bash
npx tsx example/readManagerBalances.ts
```

จะแสดงยอดเงิน 3 token ที่อยู่ใน Balance Manager:

| Token | คำอธิบาย |
|-------|----------|
| `SUI` | เหรียญ SUI |
| `DBUSDC` | USDC บน DeepBook (testnet) |
| `DEEP` | เหรียญ DEEP ของ DeepBook |

ตัว script ใช้ `client.deepbook.checkManagerBalance()` เช็คทีละ token แล้วแสดงผลรวม

---

## Step 8: วาง Limit Order

Limit Order = ตั้งราคาที่ต้องการซื้อ/ขายเอง ถ้าราคาถึงจุดที่ตั้งไว้ order จะ match

```bash
npx tsx example/limitOrder.ts
```

ตัว script จะ:
1. เช็คก่อนว่าวาง order ได้ไหม ด้วย `client.deepbook.canPlaceLimitOrder()`
2. ถ้าได้ จะวาง order ผ่าน `client.deepbook.deepBook.placeLimitOrder()`
3. แสดงสถานะ account (available/locked) หลังวาง order

**ค่าที่ตั้งไว้ในตัวอย่าง:**

| Parameter | ค่า | คำอธิบาย |
|-----------|-----|----------|
| `poolKey` | `"SUI_DBUSDC"` | เทรดคู่ SUI/DBUSDC |
| `isBid` | `false` | ขาย (ask) — เปลี่ยนเป็น `true` ถ้าจะซื้อ |
| `quantity` | `20` | จำนวน 20 SUI |
| `price` | `1.2` | ราคา 1.2 DBUSDC ต่อ SUI |
| `payWithDeep` | `false` | ไม่จ่ายค่า fee ด้วย DEEP |
| `expireTimestamp` | `+1 ชั่วโมง` | order หมดอายุใน 1 ชั่วโมง |

> แก้ค่าต่าง ๆ ได้ในไฟล์ [`example/limitOrder.ts`](./example/limitOrder.ts)

---

## Step 9: วาง Market Order

Market Order = ซื้อ/ขายทันทีที่ราคาตลาดปัจจุบัน ไม่ต้องรอ match

```bash
npx tsx example/marketOrder.ts
```

ตัว script จะเรียก `client.deepbook.deepBook.placeMarketOrder()` วาง order ที่ pool `SUI_DBUSDC`

**ค่าที่ตั้งไว้ในตัวอย่าง:**

| Parameter | ค่า | คำอธิบาย |
|-----------|-----|----------|
| `poolKey` | `"SUI_DBUSDC"` | เทรดคู่ SUI/DBUSDC |
| `isBid` | `false` | ขาย (ask) |
| `quantity` | `1` | จำนวน 1 SUI |
| `payWithDeep` | `false` | ไม่จ่ายค่า fee ด้วย DEEP |

> แก้ค่าต่าง ๆ ได้ในไฟล์ [`example/marketOrder.ts`](./example/marketOrder.ts)

---

## Step 10: Swap Token

Swap = แลกเปลี่ยน token ตรง ๆ เลย ง่ายกว่า order

```bash
npx tsx example/swapOrder.ts
```

ตัว script จะเรียก `client.deepbook.deepBook.swapExactBaseForQuote()` แลก SUI เป็น DBUSDC แล้วโอน coin กลับเข้า wallet ของเรา

**ค่าที่ตั้งไว้ในตัวอย่าง:**

| Parameter | ค่า | คำอธิบาย |
|-----------|-----|----------|
| `poolKey` | `"SUI_DBUSDC"` | แลกจาก SUI เป็น DBUSDC |
| `amount` | `1` | จำนวน SUI ที่จะแลก |
| `deepAmount` | `1` | จำนวน DEEP สำหรับค่า fee |
| `minOut` | `0.5` | จำนวน DBUSDC ขั้นต่ำที่ยอมรับได้ |

> แก้ค่าต่าง ๆ ได้ในไฟล์ [`example/swapOrder.ts`](./example/swapOrder.ts)

---

## Step 11: ยกเลิก Order ทั้งหมด

```bash
npx tsx example/cancelOrder.ts
```

ตัว script จะ:
1. เรียก `client.deepbook.deepBook.cancelAllOrders()` ยกเลิก order ทั้งหมดในpool `SUI_DBUSDC`
2. แสดงสถานะ account (available/locked) หลังยกเลิก — เงินที่ locked อยู่จะปลดล็อกกลับมา

---

## Step 12: ถอนเงินออกจาก Balance Manager

```bash
npx tsx example/withdraw.ts
```

ตัว script จะเรียก `client.deepbook.balanceManager.withdrawAllFromManager()` ถอน SUI ทั้งหมดออกจาก Balance Manager กลับเข้า wallet ของเรา

---

## สรุป Flow ทั้งหมด

```
1. npm install                          → ติดตั้ง dependencies
2. ตั้งค่า .env                         → ใส่ private key, network
3. balanceManager.create.ts             → สร้าง Balance Manager
4. depositSui.ts                        → ฝาก SUI เข้า Balance Manager
5. readManagerBalances.ts               → เช็คยอดเงิน (SUI, DBUSDC, DEEP)
6. limitOrder.ts                        → วาง Limit Order (ตั้งราคาเอง)
7. marketOrder.ts                       → วาง Market Order (ราคาตลาด)
8. swapOrder.ts                         → Swap SUI → DBUSDC
9. cancelOrder.ts                       → ยกเลิก Order ทั้งหมด
10. withdraw.ts                         → ถอนเงินออกจาก Balance Manager
```

---

## เพิ่มเติม

- Slide: [`deepbookv3.pdf`](./deepbookv3.pdf)
- DeepBook V3 Docs: https://docs.deepbook.tech
- Facebook Group: https://www.facebook.com/groups/onthemoveth
- X (Twitter): https://x.com/onthemoveth

มีคำถามหรือติดปัญหาตรงไหน ถามได้เลยในกลุ่ม **ON THE MOVE** ครับ!
