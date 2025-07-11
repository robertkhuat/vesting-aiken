// import các thư viện cần thiết
import {
  Blockfrost,
  Lucid,
  Addresses,
  fromHex,
  toHex,
  fromText,
  Data,
  Constr,
} from "https://deno.land/x/lucid@0.20.9/mod.ts";
import "jsr:@std/dotenv/load";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";

const menomic1 = Deno.env.get("MNEMONIC1");
const menomic2 = Deno.env.get("MNEMONIC2");
const blockfrostId = Deno.env.get("BLOCKFROST_ID");
const blockfrostNetwork = Deno.env.get("BLOCKFROST_NETWORK");
const lucid = new Lucid({
  provider: new Blockfrost(blockfrostNetwork, blockfrostId),
});
lucid.selectWalletFromSeed(menomic2);
const address = await lucid.wallet.address();
console.log("Address: " + address);

const validator = await readValidator();
const contractAddress = lucid.newScript(validator).toAddress();
console.log("Contract Address: " + contractAddress);

async function readValidator(): Promise<SpendingValidator> {
  const validator = JSON.parse(await Deno.readTextFile("plutus.json"))
    .validators[0];
  return {
    type: "PlutusV3",
    script: validator.compiledCode, // giữ nguyên chuỗi hex CBOR
  };
}

const utxos = await lucid.utxosAt(contractAddress);
if (utxos.length === 0) {
  throw new Error("No UTXOs found at the contract address");
}
console.log("UTXOs at contract address:", utxos);

const utxo = utxos.find((u) => u.assets?.["lovelace"] === 8000000n);
if (!utxo) {
  throw new Error(
    "No UTXO with 5000000 Lovelace found at the contract address"
  );
}

const redeemer = Data.void();

const paymentHash = Addresses.inspect(address).payment?.hash;
console.log("Payment Hash:", paymentHash);

// Deno.exit(0); // Dừng chương trình tại đây để kiểm tra địa chỉ ví
const offsetvalid = 1 * 60 * 1000; // 1 phút
const tx = await lucid
  .newTx()
  .collectFrom([utxo], redeemer)
  .addSigner(paymentHash)
  .attachScript(validator)
  .validTo(Date.now()) // Thay đổi thời gian hết hạn nếu cần
  .commit();

const signedTx = await tx.sign().commit();
const txHash = await signedTx.submit();
console.log(`8000000 Lovelace unlocked from the contract at: Tx ID: ${txHash}`);
