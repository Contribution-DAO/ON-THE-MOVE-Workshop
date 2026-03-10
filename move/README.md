# My Items — Smart Contract Workshop

## Step 1: สร้างโปรเจกต์ Move

```bash
sui move new my_items
cd my_items
```

คำสั่งนี้จะสร้างโครงสร้างโฟลเดอร์ให้แบบนี้:

```
my_items/
├── Move.toml
└── sources/
    └── my_items.move    ← ไฟล์นี้จะว่างอยู่
```

---

## Step 2: ใส่โค้ด Smart Contract

เอาไฟล์ `my_items.move` ที่เตรียมไว้ใน workshop ไปวางแทนที่ไฟล์ `sources/my_items.move`

```bash
cp ../my_items.move sources/my_items.move
```

หรือจะเปิดไฟล์ `sources/my_items.move` แล้ว copy โค้ดทั้งหมดจาก [`my_items.move`](./my_items.move) ไปวางก็ได้

---

## Step 3: Build โปรเจกต์

```bash
sui move build
```

ถ้าทุกอย่างถูกต้อง จะเห็นข้อความประมาณนี้:

```
UPDATING GIT DEPENDENCY https://github.com/MystenLabs/sui.git
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING my_items
```

> ถ้า build ไม่ผ่าน ให้เช็คว่าชื่อ module ใน Move.toml ตรงกับใน source code (ต้องเป็น `my_items`)

---

## Step 4: Deploy (Publish) ขึ้น Testnet

```bash
sui client publish --gas-budget 100000000
```

เมื่อ publish สำเร็จ จะเห็น output ยาว ๆ ให้มองหา **Package ID** ซึ่งจะอยู่ในส่วน `Published Objects`:

```
╭──────────────────────────────────────────────────────────────╮
│ Published Objects                                            │
├──────────────────────────────────────────────────────────────┤
│ PackageID: 0xabcd1234...                                     │
╰──────────────────────────────────────────────────────────────╯
```

**เก็บ Package ID ไว้ให้ดี!** เราจะใช้มันในทุก ๆ คำสั่งต่อจากนี้

ให้ตั้งค่าตัวแปรไว้ใน terminal จะได้ไม่ต้องพิมพ์ซ้ำ:

```bash
export PACKAGE_ID=0xabcd1234...ใส่_package_id_ของคุณตรงนี้
```

---

## Step 5: เรียกใช้งาน Function ทีละตัว

### 5.1 Mint Item (สร้างไอเทมเข้ากระเป๋าตัวเอง)

```bash
sui client call \
  --package $PACKAGE_ID \
  --module items \
  --function mint_to_sender \
  --args '"Flame Sword"' '"Warrior"' '100' '"https://example.com/flame-sword.png"' \
  --gas-budget 10000000
```

**อธิบาย argument:**
| ลำดับ | ชื่อ | ค่าตัวอย่าง | คำอธิบาย |
|-------|------|-------------|----------|
| 1 | name | `"Flame Sword"` | ชื่อไอเทม |
| 2 | class | `"Warrior"` | คลาสของไอเทม |
| 3 | power | `100` | ค่าพลังโจมตี |
| 4 | image_url | `"https://example.com/flame-sword.png"` | URL รูปภาพ |

เมื่อสำเร็จ ให้มองหา **Object ID** ของ Item ที่สร้างขึ้นมาในส่วน `Created Objects`:

```bash
export ITEM_ID=0x...ใส่_item_object_id_ตรงนี้
```

> ลองสร้างไอเทมเพิ่มอีกสักตัวเพื่อเอาไว้ทดลองในขั้นตอนถัดไป!

---

### 5.2 สร้าง Inventory (กระเป๋าเก็บไอเทม)

```bash
sui client call \
  --package $PACKAGE_ID \
  --module items \
  --function create_inventory_to_sender \
  --gas-budget 10000000
```

ไม่ต้องส่ง argument อะไรเลย ระบบจะสร้าง Inventory ให้เราอัตโนมัติ

เก็บ Object ID ของ Inventory:

```bash
export INVENTORY_ID=0x...ใส่_inventory_object_id_ตรงนี้
```

---

### 5.3 เก็บ Item เข้า Inventory

```bash
sui client call \
  --package $PACKAGE_ID \
  --module items \
  --function put_into_inventory \
  --args $INVENTORY_ID $ITEM_ID \
  --gas-budget 10000000
```

**อธิบาย argument:**
| ลำดับ | ชื่อ | คำอธิบาย |
|-------|------|----------|
| 1 | inv | Object ID ของ Inventory |
| 2 | item | Object ID ของ Item ที่จะเก็บเข้าไป |

หลังเรียกคำสั่งนี้ Item จะถูกโอนไปยัง address ของเจ้าของ Inventory

---

### 5.4 Attach Stats (ใส่ค่าสถานะให้ไอเทม)

ก่อนจะอัพเลเวลได้ ต้อง attach stats ให้ไอเทมก่อน ทำได้แค่ **ครั้งเดียว** ต่อไอเทม!

```bash
sui client call \
  --package $PACKAGE_ID \
  --module items \
  --function attach_stats_once \
  --args $ITEM_ID '5' '100' \
  --gas-budget 10000000
```

**อธิบาย argument:**
| ลำดับ | ชื่อ | ค่าตัวอย่าง | คำอธิบาย |
|-------|------|-------------|----------|
| 1 | item | Object ID | ไอเทมที่จะ attach stats |
| 2 | rarity | `5` | ค่าความหายาก (u8: 0-255) |
| 3 | durability | `100` | ค่าความทนทาน |

> ค่า level จะเริ่มต้นที่ 1 อัตโนมัติ

> ถ้าลอง attach ซ้ำจะ error `E_ALREADY_HAS_STATS` (error code 2) เพราะแต่ละ item ใส่ stats ได้ครั้งเดียว

---

### 5.5 Level Up! (อัพเลเวลไอเทม)

```bash
sui client call \
  --package $PACKAGE_ID \
  --module items \
  --function level_up \
  --args $ITEM_ID '3' \
  --gas-budget 10000000
```

**อธิบาย argument:**
| ลำดับ | ชื่อ | ค่าตัวอย่าง | คำอธิบาย |
|-------|------|-------------|----------|
| 1 | item | Object ID | ไอเทมที่จะอัพเลเวล |
| 2 | times | `3` | จำนวนครั้งที่จะอัพ |

**สิ่งที่เกิดขึ้นเมื่อ level up:**
- `level` เพิ่มขึ้นตาม `times` (เช่น level 1 → 4 ถ้า times = 3)
- `power` เพิ่มขึ้น `times * 3` (เช่น power 100 → 109 ถ้า times = 3)
- `durability` ลดลงตาม `times` (เช่น 100 → 97 ถ้า times = 3)

> ต้อง `attach_stats_once` ก่อน ไม่งั้นจะ error `E_NO_STATS` (error code 3)

> ค่า `times` ต้องมากกว่า 0 ไม่งั้นจะ error `E_ZERO_TIMES` (error code 5)

---

### 5.6 Add Element (เพิ่มธาตุให้ไอเทม)

ไอเทมสามารถมีธาตุได้ 3 แบบ:
| ค่า | ธาตุ |
|-----|------|
| `10` | Fire |
| `11` | Wind |
| `12` | Ice |

```bash
sui client call \
  --package $PACKAGE_ID \
  --module items \
  --function add_element \
  --args $ITEM_ID '10' '50' \
  --gas-budget 10000000
```

**อธิบาย argument:**
| ลำดับ | ชื่อ | ค่าตัวอย่าง | คำอธิบาย |
|-------|------|-------------|----------|
| 1 | item | Object ID | ไอเทมที่จะเพิ่มธาตุ |
| 2 | element | `10` | ชนิดธาตุ (10=Fire, 11=Wind, 12=Ice) |
| 3 | bonus | `50` | ค่าโบนัสพลังธาตุ |

> ถ้าเพิ่มธาตุเดิมซ้ำ ค่า bonus จะ **สะสมเพิ่มขึ้น** ไม่ใช่แทนที่ เช่น Fire bonus 50 + 30 = 80

> ใส่ค่า element อื่นนอกจาก 10, 11, 12 จะ error `E_INVALID_ELEMENT` (error code 4)

ลองเพิ่มหลายธาตุให้ไอเทมเดียวกันได้เลย:

```bash
# เพิ่มธาตุ Wind
sui client call \
  --package $PACKAGE_ID \
  --module items \
  --function add_element \
  --args $ITEM_ID '11' '30' \
  --gas-budget 10000000

# เพิ่มธาตุ Ice
sui client call \
  --package $PACKAGE_ID \
  --module items \
  --function add_element \
  --args $ITEM_ID '12' '20' \
  --gas-budget 10000000
```

---

## Step 6: ดูข้อมูล Object บน Explorer

หลังจากทำทุกขั้นตอนแล้ว สามารถเช็คข้อมูลไอเทมได้ 2 วิธี:

### วิธีที่ 1: ใช้ SUI CLI

```bash
sui client object $ITEM_ID
```

จะเห็นข้อมูลพื้นฐานของ Item เช่น name, class, power, image_url

ถ้าอยากดู Dynamic Fields ที่เราเพิ่มไป (Stats, Element Bonuses) ให้ใช้คำสั่งนี้:

```bash
sui client dynamic-field $ITEM_ID
```

จะเห็นรายการ Dynamic Fields ทั้งหมดที่ติดอยู่กับไอเทม เช่น:
- `StatsKey` → ข้อมูล level, rarity, durability (จาก `attach_stats_once`)
- `u8` key 10, 11, 12 → ข้อมูล ElementBonus ของแต่ละธาตุ (จาก `add_element`)

### วิธีที่ 2: ใช้ SUI Explorer

เปิด browser แล้วไปที่:

```
https://testnet.suivision.xyz/object/ใส่_ITEM_ID_ตรงนี้
```

จะเห็นข้อมูลทั้งหมดของ Item รวมถึง Dynamic Fields ที่เราเพิ่มไป (Stats, Element Bonuses)

---

## สรุป Error Codes

| Code | ชื่อ | สาเหตุ |
|------|------|--------|
| 1 | `E_NOT_OWNER` | ไม่ใช่เจ้าของ Inventory (พยายาม take_out โดยคนอื่น) |
| 2 | `E_ALREADY_HAS_STATS` | ไอเทมนี้ attach stats ไปแล้ว |
| 3 | `E_NO_STATS` | ยังไม่ได้ attach stats (ต้องทำก่อน level_up) |
| 4 | `E_INVALID_ELEMENT` | ใส่ค่า element ที่ไม่ใช่ 10, 11, 12 |
| 5 | `E_ZERO_TIMES` | ใส่ค่า times = 0 ใน level_up |

---

## สรุป Flow ทั้งหมด

```
1. mint_to_sender         → สร้างไอเทมเข้ากระเป๋า
2. create_inventory_to_sender → สร้างกระเป๋า Inventory
3. put_into_inventory     → เก็บไอเทมเข้ากระเป๋า
4. attach_stats_once      → ใส่ค่าสถานะ (ทำได้ครั้งเดียว)
5. level_up               → อัพเลเวล (power เพิ่ม, durability ลด)
6. add_element            → เพิ่มธาตุ Fire/Wind/Ice (สะสมได้)
```

---

## เพิ่มเติม

- Source code: [`my_items.move`](./my_items.move)
- Slide: [`move_workshop.pdf`](./move_workshop.pdf)
- Facebook Group: https://www.facebook.com/groups/onthemoveth
- X (Twitter): https://x.com/onthemoveth

มีคำถามหรือติดปัญหาตรงไหน ถามได้เลยในกลุ่ม **ON THE MOVE** ครับ!
