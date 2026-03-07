module my_items::items {
    use 0x2::object;
    use 0x2::transfer;
    use 0x2::tx_context as tx_context;
    use 0x2::dynamic_field as df;
    use std::string::String;

    // -------------------------
    // Constants / Errors
    // -------------------------
    const E_NOT_OWNER: u64 = 1;
    const E_ALREADY_HAS_STATS: u64 = 2;
    const E_NO_STATS: u64 = 3;
    const E_INVALID_ELEMENT: u64 = 4;
    const E_ZERO_TIMES: u64 = 5;

    const ELEM_FIRE: u8 = 10;
    const ELEM_WIND: u8 = 11;
    const ELEM_ICE:  u8 = 12;

    // -------------------------
    // Base structs
    // -------------------------
    public struct Item has key, store {
        id: object::UID,
        name: String,
        class: String,
        power: u64,
        image_url: String,
    }

    public struct Inventory has key, store {
        id: object::UID,
        owner: address,
    }

    // -------------------------
    // Dynamic Field keys/values
    // -------------------------
    public struct StatsKey has copy, drop, store {}

    public struct ItemStats has store, drop {
        level: u64,
        rarity: u8,
        durability: u64,
    }

    public struct ElementBonus has store, drop {
        bonus: u64,
    }

    // =========================================================
    // Mint / Inventory
    // =========================================================

    ///สร้าง Item แล้ว "คืนค่า" ให้คนเรียกเอาไปต่อใน PTB ได้
    public fun mint(
        name: String,
        class: String,
        power: u64,
        image_url: String,
        ctx: &mut tx_context::TxContext
    ): Item {
        Item { id: object::new(ctx), name, class, power, image_url }
    }

    ///Mint แล้วโอนเข้ากระเป๋าผู้เรียกทันที ✅
    public entry fun mint_to_sender(
        name: String,
        class: String,
        power: u64,
        image_url: String,
        ctx: &mut tx_context::TxContext
    ) {
        let item = mint(name, class, power, image_url, ctx);
        transfer::public_transfer(item, tx_context::sender(ctx));
    }

    ///สร้าง Inventory แล้วคืนค่า
    public fun create_inventory(ctx: &mut tx_context::TxContext): Inventory {
        Inventory { id: object::new(ctx), owner: tx_context::sender(ctx) }
    }

    ///สร้าง Inventory แล้วโอนเข้ากระเป๋าผู้เรียก
    public entry fun create_inventory_to_sender(ctx: &mut tx_context::TxContext) {
        let inv = create_inventory(ctx);
        transfer::public_transfer(inv, tx_context::sender(ctx));
    }

    /// นำ Item เข้าสู่กระเป๋าเจ้าของ Inventory โดยตรง
    public entry fun put_into_inventory(inv: &Inventory, item: Item) {
        transfer::public_transfer(item, inv.owner);
    }

    /// ตรวจ owner แล้วคืน Item กลับมา (composable)
    public fun take_out_from_inventory(
        inv: &Inventory,
        item: Item,
        ctx: &tx_context::TxContext
    ): Item {
        assert!(inv.owner == tx_context::sender(ctx), E_NOT_OWNER);
        item
    }

    // =========================================================
    // Attach stats once
    // =========================================================
    public entry fun attach_stats_once(
        item: &mut Item,
        rarity: u8,
        durability: u64
    ) {
        assert!(!df::exists_(&item.id, StatsKey{}), E_ALREADY_HAS_STATS);
        let stats = ItemStats { level: 1, rarity, durability };
        df::add(&mut item.id, StatsKey{}, stats);
    }

    // =========================================================
    // Level up
    // =========================================================
    public entry fun level_up(item: &mut Item, times: u64) {
        assert!(times > 0, E_ZERO_TIMES);
        assert!(df::exists_(&item.id, StatsKey{}), E_NO_STATS);

        let stats = df::borrow_mut<StatsKey, ItemStats>(&mut item.id, StatsKey{});
        stats.level = stats.level + times;

        item.power = item.power + (times * 3);

        if (stats.durability > times) {
            stats.durability = stats.durability - times;
        } else {
            stats.durability = 0;
        }
    }

    // =========================================================
    // Add element
    // =========================================================
    fun assert_valid_element(e: u8) {
        assert!(e == ELEM_FIRE || e == ELEM_WIND || e == ELEM_ICE, E_INVALID_ELEMENT);
    }

    public entry fun add_element(item: &mut Item, element: u8, bonus: u64) {
        assert_valid_element(element);

        if (df::exists_(&item.id, element)) {
            let eb = df::borrow_mut<u8, ElementBonus>(&mut item.id, element);
            eb.bonus = eb.bonus + bonus;
        } else {
            df::add<u8, ElementBonus>(&mut item.id, element, ElementBonus { bonus });
        }
    }

    // =========================================================
    // Read helpers
    // =========================================================
    public fun get_stats(item: &Item): (u64, u8, u64) {
        if (df::exists_(&item.id, StatsKey{})) {
            let s = df::borrow<StatsKey, ItemStats>(&item.id, StatsKey{});
            (s.level, s.rarity, s.durability)
        } else {
            (0, 0, 0)
        }
    }

    public fun get_element_bonus(item: &Item, element: u8): u64 {
        if (df::exists_(&item.id, element)) {
            df::borrow<u8, ElementBonus>(&item.id, element).bonus
        } else {
            0
        }
    }
}