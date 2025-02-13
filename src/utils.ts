import {Address, BigDecimal, BigInt, log} from "@graphprotocol/graph-ts";
import {Launchpad} from "../generated/Launchpad/Launchpad"
import {ERC20Token} from "../generated/templates/LiquidityPairListener/ERC20Token";
import {NativeTokenPriceOracle} from "../generated/templates/LiquidityPairListener/NativeTokenPriceOracle";
import {UniswapV2Factory} from "../generated/templates/LiquidityPairListener/UniswapV2Factory";
import {UniswapV3Factory} from "../generated/templates/LiquidityPairListener/UniswapV3Factory";
import {UniswapV2Pair} from "../generated/templates/LiquidityPairListener/UniswapV2Pair";
import {UniswapV3Pair} from "../generated/templates/LiquidityPairListener/UniswapV3Pair";
import {
    E_18,
    LAUNCHPAD, N_18,
    NATIVE_PRICE_ORACLE, UNDERLYING_STABLE_TOKEN_UNISWAP_V3_PAIR_TAX_RATE,
    UNISWAP_V2_FACTORY,
    UNISWAP_V3_FACTORY,
    WRAPPED_NATIVE_TOKEN,
    ZERO
} from "./constants";


export function GetUnderlyingStableToken() : Address{
    return Launchpad.bind(LAUNCHPAD).baks()
}

export function GetUniswapV2PairByAddress(address : Address) : UniswapV2Pair{{
    return UniswapV2Pair.bind(address)
}}

export function GetUniswapV2Pair(token0 : Address, token1 : Address) : UniswapV2Pair{
    const factory = UniswapV2Factory.bind(UNISWAP_V2_FACTORY)

    if(factory._address.equals(ZERO)){
        log.error("Couldn't fetch UniswapV2 Pair: the factory is missing.",[])
        return UniswapV2Pair.bind(ZERO)
    }

    const pair = factory.getPair(token0, token1)

    if(pair.equals(ZERO)){
        log.error(`Couldn't fetch UniswapV2 Pair: the pair for tokens: ${token0.toHexString()}, ${token1.toHexString()} is missing.`, [])
        return UniswapV2Pair.bind(ZERO)
    }

    return UniswapV2Pair.bind(pair)
}

export function GetUniswapV3Pair(token0 : Address, token1 : Address, tax : i32) : UniswapV3Pair{
    const factory = UniswapV3Factory.bind(UNISWAP_V3_FACTORY)

    if(factory._address.equals(ZERO)){
        log.error("Couldn't fetch UniswapV3 Pair: the factory is missing.",[])
        return UniswapV3Pair.bind(ZERO)
    }

    const pair = factory.getPool(token0, token1, i32(tax))

    if(pair.equals(ZERO)){
        log.error(`Couldn't fetch UniswapV3 Pair: the pair for tokens: ${token0.toHexString()}, ${token1.toHexString()} and ${tax} fee tier is missing.`, [])
        return UniswapV3Pair.bind(ZERO)
    }

    return UniswapV3Pair.bind(pair)
}

export function GetAITokenPriceInUSD(address : Address) : BigDecimal{
    return GetAITokenPriceToStableInUniswapV2Pair(GetUniswapV2Pair(address, GetUnderlyingStableToken())).times(GetStableTokenUSDPrice())
}

export function GetAITokenPriceToStableInUniswapV2Pair(pair : UniswapV2Pair) : BigDecimal{
    if(pair._address.equals(ZERO)){
        log.error("Couldn't fetch AI Token price: the pair is missing.", [])
        return BigDecimal.zero()
    }

    const underlyingStableTokenAddress = Launchpad.bind(LAUNCHPAD).baks()

    if(underlyingStableTokenAddress.equals(ZERO)){
        log.error(`Couldn't fetch AI Token price: the underlying stable token is blank.`, [])
        return BigDecimal.zero()
    }

    const token0 = ERC20Token.bind(pair.token0())
    const token1 = ERC20Token.bind(pair.token1())
    const reserves = pair.getReserves()
    const reserve0 = reserves.get_reserve0().toBigDecimal()
    const reserve1 = reserves.get_reserve1().toBigDecimal()

    if(token0._address.equals(underlyingStableTokenAddress)){
        return reserve1.div(reserve0)
    }
    return reserve0.div(reserve1)
}

export function GetNativeTokenPrice() : BigDecimal {
    const oracle = NativeTokenPriceOracle.bind(NATIVE_PRICE_ORACLE)
    if(oracle._address.equals(ZERO)){
        log.error("Couldn't fetch Native TokenPrice: the oracle is missing.",[])
        return BigDecimal.zero()
    }

    const round = oracle.latestRound()
    const decimals = oracle.decimals()
    return oracle.getAnswer(round).toBigDecimal().div(BigDecimal.fromString(decimals.toString()))
}

export function GetStableTokenUSDPrice() : BigDecimal{
    const underlyingStableTokenAddress = Launchpad.bind(LAUNCHPAD).baks()

    if(underlyingStableTokenAddress.equals(ZERO)){
        log.error(`Couldn't fetch Underlying Stable Token price: the underlying stable token is blank.`,[])
        return BigDecimal.zero()
    }

    const pair = GetUniswapV3Pair(WRAPPED_NATIVE_TOKEN, underlyingStableTokenAddress, UNDERLYING_STABLE_TOKEN_UNISWAP_V3_PAIR_TAX_RATE)

    if(pair._address.equals(ZERO)){
        log.error(`Couldn't fetch Underlying Stable Token price: the pair is missing for tokens: ${WRAPPED_NATIVE_TOKEN.toHexString()},${underlyingStableTokenAddress.toHexString()}.`,[])
        return BigDecimal.zero()
    }

    const nativePrice = GetNativeTokenPrice()
    const sqrtPrice = pair.slot0().getSqrtPriceX96().toBigDecimal()
    const token0 = pair.token0()

    let normalizedPrice = sqrtPrice.div(BigInt.fromI32(2).pow(96).toBigDecimal())
    normalizedPrice *= normalizedPrice
    if(token0.equals(underlyingStableTokenAddress)){
        return BigDecimal.fromString("1").div(normalizedPrice).times(nativePrice)
    }
    return normalizedPrice.times(nativePrice)
}

export function GetTotalSupply(address : Address) : BigInt {
    return ERC20Token.bind(Address.fromBytes(address)).totalSupply()
}

export function GetAITokenMarketCapitalization(address : Address) : BigDecimal {
    return GetTotalSupply(address).toBigDecimal().div(N_18).times(GetAITokenPriceInUSD(address))
}