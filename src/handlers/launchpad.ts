import { log } from "@graphprotocol/graph-ts";
import { Listing } from "../../generated/Launchpad/Launchpad";
import { LiquidityPairListener } from "../../generated/templates";
import { LiquidityPair, Token } from "../../generated/schema";

import {
  CalculateLiquidityPool,
  GetAITokenMarketCapitalization,
  GetAITokenPriceInNative,
  GetAITokenPriceInUSD,
  GetTotalSupply,
  GetUnderlyingStableToken,
  GetUniswapV2Pair,
} from "../utils";
import { ZERO_BD, ZERO_BI } from "../constants";

export function handleListing(event: Listing): void {
  log.info("Handle new token listing: " + event.params.token.toHexString(), []);
  const underlyingStableTokenAddress = GetUnderlyingStableToken();

  const pair = GetUniswapV2Pair(
    event.params.token,
    underlyingStableTokenAddress
  );

  let token = new Token(event.params.token.toHexString());
  let liquidityPair = new LiquidityPair(pair._address.toHexString());

  token.tokenOwner = event.params.tokenOwner;
  token.address = event.params.token;
  token.name = event.params.name;
  token.symbol = event.params.symbol;
  token.siteUrl = event.params.siteUrl;
  token.imageUrl = event.params.imageUrl;
  token.chatUrl = event.params.chatUrl;
  token.socialUrl = event.params.socialUrl;
  token.description = event.params.description;
  token.decimals = i32(18);

  token.blockNumber = event.block.number;
  token.blockTimestamp = event.block.timestamp;
  token.transactionHash = event.transaction.hash;

  const token0 = pair.token0();
  const token1 = pair.token1();
  const reserves = pair.getReserves();
  const reserve0 = reserves.get_reserve0();
  const reserve1 = reserves.get_reserve1();

  liquidityPair.token0 = token0;
  liquidityPair.token1 = token1;
  liquidityPair.reserve0 = reserve0;
  liquidityPair.reserve1 = reserve1;

  const aiTokenPrice = GetAITokenPriceInUSD(event.params.token);

  token.pair = pair._address.toHexString();
  token.price = aiTokenPrice;
  token.priceInNative = GetAITokenPriceInNative(aiTokenPrice);
  token.supply = GetTotalSupply(event.params.token);
  token.marketCap = GetAITokenMarketCapitalization(event.params.token);
  token.liquidityPool = CalculateLiquidityPool(reserve0, reserve1, aiTokenPrice);

  token.buys = ZERO_BI;
  token.sells = ZERO_BI;
  token.buyVolumeUSD = ZERO_BD;
  token.sellVolumeUSD = ZERO_BD;
  token.sellers = [];
  token.buyers = [];

  LiquidityPairListener.create(pair._address);

  token.save();
  liquidityPair.save();
}
