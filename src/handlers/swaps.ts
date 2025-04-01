import { Swap as SwapEvent } from "../../generated/templates/LiquidityPairListener/UniswapV2PairListener";
import {
  LiquidityPair,
  Token,
  Swap,
} from "../../generated/schema";
import {
  GetAITokenMarketCapitalization,
  GetAITokenPriceInUSD,
  GetTotalSupply,
  GetUnderlyingStableToken,
  GetUniswapV2PairByAddress,
} from "../utils";
import { E_18, ONE_BI } from "../constants";
import { UpdateToken24hData, UpdateTokenPrice5minute, UpdateTokenPrice6h, UpdateTokenPriceHour } from "../updates";

export function handleSwap(event: SwapEvent): void {
  const liquidityPairAddress = event.address;

  const pair = GetUniswapV2PairByAddress(liquidityPairAddress);

  let liquidityPair = LiquidityPair.load(liquidityPairAddress.toHexString())!;

  const reserves = pair.getReserves();

  liquidityPair.reserve0 = reserves.get_reserve0();
  liquidityPair.reserve1 = reserves.get_reserve1();

  const underlyingStableTokenAddress = GetUnderlyingStableToken();

  let aiTokenAddress = pair.token1().equals(underlyingStableTokenAddress)
    ? pair.token0()
    : pair.token1();

  let token = Token.load(aiTokenAddress.toHexString())!;

  const timeStamp = event.block.timestamp;
  const user = event.transaction.from;
  const priceUSD = GetAITokenPriceInUSD(aiTokenAddress);

  token.price = priceUSD;
  token.supply = GetTotalSupply(aiTokenAddress);
  token.marketCap = GetAITokenMarketCapitalization(aiTokenAddress);

  let swap = new Swap(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  swap.user = user;
  swap.transactionHash = event.transaction.hash;
  swap.blockTimestamp = timeStamp;
  swap.pair = pair._address.toHexString();
  swap.price = token.price;
  swap.token = token.id;

  if (
    (pair.token0().equals(token.address) && !event.params.amount0In.isZero()) ||
    (pair.token1().equals(token.address) && !event.params.amount1In.isZero())
  ) {
    swap.amount = event.params.amount0In.isZero()
      ? event.params.amount1In
      : event.params.amount0In;
    swap.type = "sell";
      token.sells = token.sells.plus(ONE_BI);
      token.sellVolumeUSD = token.sellVolumeUSD.plus(swap.amount.toBigDecimal().div(E_18).times(priceUSD));

      let sellersArray = token.sellers;
      if (sellersArray === null) {
        sellersArray = [];
      }
      if (!sellersArray.includes(user)) {
        sellersArray.push(user);
      }
      token.sellers = sellersArray;

      UpdateToken24hData(token, event, swap.amount, priceUSD, true);
  } else {
    swap.amount = event.params.amount0Out.isZero()
      ? event.params.amount1Out
      : event.params.amount0Out;
    swap.type = "buy";
      token.buys = token.buys.plus(ONE_BI);
      token.buyVolumeUSD = token.buyVolumeUSD.plus(swap.amount.toBigDecimal().div(E_18).times(priceUSD));

      let buyersArray = token.buyers;
      if (buyersArray === null) {
        buyersArray = [];
      }
      if (!buyersArray.includes(user)) {
        buyersArray.push(user);
      }
      token.buyers = buyersArray;

      UpdateToken24hData(token, event, swap.amount, priceUSD, false);
  }
  UpdateTokenPrice6h(token, event, priceUSD);
  UpdateTokenPriceHour(token, event, priceUSD);
  UpdateTokenPrice5minute(token, event, priceUSD);
  liquidityPair.swaps.load().push(swap);

  token.save();
  liquidityPair.save();
  swap.save();
}