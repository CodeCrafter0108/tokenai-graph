import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  NATIVE_PRICE_ORACLE,
  SONIC_ADDRESS,
  USDC_ADDRESS,
  USDC_PRICE_ORACLE,
} from "../constants";
import { UpdateTokenPrice } from "../utils";

export function handleBlock(block: ethereum.Block): void {
  if (block.number.mod(BigInt.fromI32(100)).equals(BigInt.zero())) {
    UpdateTokenPrice(
      NATIVE_PRICE_ORACLE,
      SONIC_ADDRESS,
      "Sonic",
      "S",
      "https://raw.githubusercontent.com/YieldEnhancementLabs/token-logos/main/146/0x0000000000000000000000000000000000000000/token-logo.png",
      i32(18)
    );
    UpdateTokenPrice(
      USDC_PRICE_ORACLE,
      USDC_ADDRESS,
      "USDC",
      "USDC",
      "https://raw.githubusercontent.com/YieldEnhancementLabs/token-logos/main/146/0x29219dd400f2Bf60E5a23d13Be72B486D4038894/token-logo.png",
      i32(6)
    );
  }
}

