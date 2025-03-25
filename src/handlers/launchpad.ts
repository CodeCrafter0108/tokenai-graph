import { log } from "@graphprotocol/graph-ts";
import { Listing } from "../../generated/Launchpad/Launchpad";
import { LiquidityPairListener } from "../../generated/templates";
import { LiquidityPair, Token, TokenCounter } from "../../generated/schema";

import {
  GetAITokenMarketCapitalization,
  GetAITokenPriceInUSD,
  GetTotalSupply,
  GetUnderlyingStableToken,
  GetUniswapV2Pair,
} from "../utils";

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

  liquidityPair.token0 = pair.token0();
  liquidityPair.token1 = pair.token1();
  const reserves = pair.getReserves();
  liquidityPair.reserve0 = reserves.get_reserve0();
  liquidityPair.reserve1 = reserves.get_reserve1();

  const aiTokenPrice = GetAITokenPriceInUSD(event.params.token);

  token.pair = pair._address.toHexString();
  token.price = aiTokenPrice;
  token.supply = GetTotalSupply(event.params.token);
  token.marketCap = GetAITokenMarketCapitalization(event.params.token);

  LiquidityPairListener.create(pair._address);

  let counter = TokenCounter.load("singleton");
  if (counter == null) {
    counter = new TokenCounter("singleton");
    counter.totalCount = 0;
  }
  counter.totalCount = counter.totalCount + 1;
  counter.save();

  token.save();
  liquidityPair.save();
}
