 module secret_message::message {
     use sui::object::UID;
     use sui::tx_context::TxContext;
     use std::string::String;

     /// Error ที่จะเกิดขึ้นเมื่อผู้ใช้ที่ไม่ได้รับอนุญาตพยายามเข้าถึงข้อความลับ
     const ENoAccess: u64 = 0;

     /// โครงสร้างของ SecretMessage ซึ่งเป็น Policy Object
     ///
     /// - Policy นี้ไม่เก็บข้อความจริงบน-chain
     /// - ตัวข้อความจะถูกเข้ารหัสและเก็บบน Walrus (off-chain)
     /// - On-chain จะเก็บเฉพาะ metadata และสิทธิ์การเข้าถึง
     ///
     /// ฟิลด์:
     /// - `sender`: address ของผู้สร้าง (ผู้ส่งข้อความลับ)
     /// - `recipient`: address ของผู้รับที่ได้รับอนุญาต
     /// - `walrus_blob_id`: ID ของ blob ที่เก็บ encrypted content บน Walrus
     public struct SecretMessage has key, store {
         id: UID,
         sender: address,
         recipient: address,
         walrus_blob_id: String,
     }

     /// ฟังก์ชันสำหรับสร้าง SecretMessage ใหม่
     ///
     /// ขั้นตอน:
     /// 1. ผู้ส่งเรียกฟังก์ชันนี้พร้อมระบุผู้รับ และ Walrus blob ID
     /// 2. ระบบสร้าง Policy Object ใหม่ (SecretMessage)
     /// 3. ส่ง Policy Object ไปยัง wallet ของผู้รับ
     ///
     /// หมายเหตุ:
     /// - ผู้รับเป็นคนเดียวที่ถือ object นี้ → สอดคล้องกับ access control
     public fun create_secret_message(
         recipient: address,
         walrus_blob_id: String,
         ctx: &mut TxContext
     ) {
         let message_policy = SecretMessage {
             id: object::new(ctx),
             sender: ctx.sender(),
             recipient,
             walrus_blob_id,
         };

         // โอน Policy Object ไปที่ผู้รับ → เพื่อให้เป็นเจ้าของสิทธิ์การถอดรหัส
         transfer::public_transfer(message_policy, recipient);
     }

     /// ฟังก์ชันหลักสำหรับทำงานร่วมกับ Seal (Decentralized Access Control Service)
     ///
     /// Concept:
     /// - Seal Key Servers จะจำลองการเรียกฟังก์ชันนี้ในขั้นตอน Verify Access
     /// - ถ้าฟังก์ชันนี้ "ผ่านเงื่อนไข" → Key Servers จะอนุญาตให้ user รับ key share
     /// - ถ้าไม่ผ่าน → จะไม่ปลดล็อก key share
     ///
     /// มันคือ "On-chain Access Control Policy"
     /// ใช้เงื่อนไขบน-chain ตรวจสอบว่าผู้ที่ขอถอดรหัสเป็น "recipient" ตัวจริงหรือไม่
     ///
     /// พารามิเตอร์:
     /// - `_`: ค่า vector<u8> ที่ Seal ต้องส่งมา (แต่ในที่นี้ไม่ใช้งาน)
     /// - `policy`: reference ไปยัง SecretMessage ของข้อความนั้น
     /// - `ctx`: ใช้ตรวจสอบว่า user ที่เรียกคือใคร
     public fun seal_approve(
         _: vector<u8>,
         policy: &SecretMessage,
         ctx: &TxContext
     ) {
         // อนุญาตเฉพาะผู้รับที่กำหนดไว้ใน policy เท่านั้น
         // ถ้า ctx.sender() ไม่ใช่ recipient → throw error
         assert!(ctx.sender() == policy.recipient, ENoAccess);
     }
 }
