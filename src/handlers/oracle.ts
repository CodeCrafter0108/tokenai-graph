import { BigDecimal, BigInt, ethereum, Address } from "@graphprotocol/graph-ts";
import { BaseToken } from "../../generated/schema";
import { PriceOracle } from "../../generated/PriceOracle/PriceOracle";
import {
  NATIVE_PRICE_ORACLE,
  SONIC_ADDRESS,
  USDC_ADDRESS,
  USDC_PRICE_ORACLE,
} from "../constants";

export function handleBlock(block: ethereum.Block): void {
  if (block.number.mod(BigInt.fromI32(100)).equals(BigInt.zero())) {
    updateTokenPrice(
      NATIVE_PRICE_ORACLE,
      SONIC_ADDRESS,
      "Sonic",
      "S",
      "https://raw.githubusercontent.com/CodeCrafter0108/tokenai-graph/main/assets/0x0000000000000000000000000000000000000000.png"
    );
    updateTokenPrice(
      USDC_PRICE_ORACLE,
      USDC_ADDRESS,
      "USDC",
      "USDC",
      "https://raw.githubusercontent.com/CodeCrafter0108/tokenai-graph/main/assets/0x29219dd400f2Bf60E5a23d13Be72B486D4038894.png"
    );
  }
}

function updateTokenPrice(
  oracleAddress: Address,
  tokenAddress: Address,
  name: string,
  symbol: string,
  imgUrl: string
): void {
  const oracle = PriceOracle.bind(oracleAddress);

  const priceResult = oracle.latestAnswer();
  const decimals = oracle.decimals();

  const price = priceResult
    .toBigDecimal()
    .div(BigDecimal.fromString(`1e${decimals.toString()}`));

  const tokenId = tokenAddress.toHexString();
  let token = BaseToken.load(tokenId);
  if (!token) {
    token = new BaseToken(tokenId);
    token.address = tokenAddress;
    token.symbol = symbol;
    token.decimals = decimals;
    token.name = name;
    token.imageUrl = imgUrl;
  }
  token.price = price;
  token.save();
}
