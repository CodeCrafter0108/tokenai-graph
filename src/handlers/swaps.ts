import {Swap as SwapEvent} from "../../generated/templates/LiquidityPairListener/UniswapV2PairListener";
import {Swap} from "../../generated/schema";
import {LiquidityPair, Token} from "../../generated/schema";
import {
    GetAITokenMarketCapitalization,
    GetAITokenPriceInUSD,
    GetTotalSupply,
    GetUnderlyingStableToken,
    GetUniswapV2PairByAddress
} from "../utils";

export function handleSwap(event: SwapEvent): void {
    const liquidityPairAddress = event.address

    const pair = GetUniswapV2PairByAddress(liquidityPairAddress)

    let liquidityPair = LiquidityPair.load(liquidityPairAddress.toHexString())!

    const reserves = pair.getReserves()

    liquidityPair.reserve0 = reserves.get_reserve0()
    liquidityPair.reserve1 = reserves.get_reserve1()

    const underlyingStableTokenAddress = GetUnderlyingStableToken()

    let aiTokenAddress = pair.token1().equals(underlyingStableTokenAddress) ?  pair.token0() : pair.token1()

    let token = Token.load(aiTokenAddress.toHexString())!

    token.price = GetAITokenPriceInUSD(aiTokenAddress)
    token.supply = GetTotalSupply(aiTokenAddress)
    token.marketCap = GetAITokenMarketCapitalization(aiTokenAddress)

    let swap = new Swap(event.transaction.hash.toHexString())
    swap.user = event.params.sender
    swap.transactionHash = event.transaction.hash
    swap.blockTimestamp = event.block.timestamp
    swap.pair = pair._address.toHexString()
    swap.price = token.price

    if(pair.token0().equals(token.address) && !event.params.amount0In.isZero() ||
        pair.token1().equals(token.address) && !event.params.amount1In.isZero()){

        swap.amount = event.params.amount0In.isZero() ? event.params.amount1In : event.params.amount0In
        swap.fromAIToken = true
    }else{
        swap.amount = event.params.amount0Out.isZero() ? event.params.amount1Out : event.params.amount0Out
        swap.fromAIToken = false
    }

    liquidityPair.swaps.load().push(swap)

    token.save()
    liquidityPair.save()
    swap.save()
}
