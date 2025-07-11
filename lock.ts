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

const menomic1 = Deno.env.get("MNEMONIC1");
const menomic2 = Deno.env.get("MNEMONIC2");
const blockfrostId = Deno.env.get("BLOCKFROST_ID");
const blockfrostNetwork = Deno.env.get("BLOCKFROST_NETWORK");

const lucid = new Lucid({
  provider: new Blockfrost(blockfrostNetwork, blockfrostId),
});

const lucid2 = new Lucid({
  provider: new Blockfrost(blockfrostNetwork, blockfrostId),
});

lucid2.selectWalletFromSeed(menomic2);
lucid.selectWalletFromSeed(menomic1);
const address = await lucid.wallet.address();
console.log("Address: " + address);
const address2 = await lucid2.wallet.address();
console.log("Address2: " + address2);

const paymentHashOwner = Addresses.inspect(address).payment?.hash;
if (!paymentHashOwner) {
  throw new Error("Failed to extract payment hash from address");
}

const paymentHashBeneficiary = Addresses.inspect(address2).payment?.hash;
if (!paymentHashBeneficiary) {
  throw new Error("Failed to extract payment hash from address");
}

// Set timeline for the lock
const currentTime = Date.now();
console.log("Current Time: " + currentTime);
const offset = 3 * 60 * 1000; // 3 phút
const deadlinePOSIX = BigInt(currentTime);

console.log("Deadline POSIX: " + deadlinePOSIX.toString());

// console.log("Current Time (UTC): " + new Date(currentTime).toISOString());
// console.log(
//   "Current Time (VN): " +
//     new Date(currentTime).toLocaleString("vi-VN", {
//       timeZone: "Asia/Ho_Chi_Minh",
//     })
// );

// console.log(
//   "Deadline POSIX (UTC): " + new Date(Number(deadlinePOSIX)).toISOString()
// );
// console.log(
//   "Deadline POSIX (VN): " +
//     new Date(Number(deadlinePOSIX)).toLocaleString("vi-VN", {
//       timeZone: "Asia/Ho_Chi_Minh",
//     })
// );
// Deno.exit(0); // Dừng chương trình tại đây để kiểm tra deadline

const datumInline = Data.to(
  new Constr(0, [deadlinePOSIX, paymentHashOwner, paymentHashBeneficiary])
);

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

const tx = await lucid
  .newTx()
  .payToContract(
    contractAddress,
    { Inline: datumInline },
    { lovelace: 8000000n }
  )
  .commit();
const signedTx = await tx.sign().commit();
const txHash = await signedTx.submit();
console.log(
  `8000000 Lovelace locked into the contract at:    Tx ID: ${txHash} `
);

// Thay Hieu
//   const tx = await lucid
//     .newTx()
//     .payToContract(signerbyAddress, { Inline: datum }, { lovelace })
//     .validTo(Date.now() + 100000)
//     .commit();
