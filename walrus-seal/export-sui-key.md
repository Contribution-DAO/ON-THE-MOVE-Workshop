# Export Sui Private Key using CLI

## 1. List all addresses

```bash
sui client addresses
```

This will display all addresses managed by your local keystore.

## 2. Export the private key

```bash
sui keytool export --key-identity <SUI_ADDRESS>
```

Replace `<SUI_ADDRESS>` with the address you want to export.

The command outputs the private key in Bech32-encoded format (starting with `suiprivkey1...`). You can use this value directly in your `.env` file.
