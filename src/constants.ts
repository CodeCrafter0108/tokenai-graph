import { Address, BigInt } from "@graphprotocol/graph-ts";

export const ZERO = Address.fromString("0x0000000000000000000000000000000000000000")

export const LAUNCHPAD = Address.fromString("0x333fE6dDA12D69bE0C7dB670785206E4419721E4")

export const UNISWAP_V2_FACTORY = Address.fromString("0xEE4bC42157cf65291Ba2FE839AE127e3Cc76f741")

export const UNISWAP_V3_FACTORY = Address.fromString("0x56CFC796bC88C9c7e1b38C2b0aF9B7120B079aef")

export const NATIVE_PRICE_ORACLE = Address.fromString("0xc76dFb89fF298145b417d221B2c747d84952e01d")

export const USDC_PRICE_ORACLE = Address.fromString("0x55bCa887199d5520B3Ce285D41e6dC10C08716C9")

export const WRAPPED_NATIVE_TOKEN = Address.fromString("0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38")

export const UNDERLYING_STABLE_TOKEN_UNISWAP_V3_PAIR_TAX_RATE = i32(3000)

export const E_18 = BigInt.fromI32(10).pow(18).toBigDecimal()

export const N_18 = BigInt.fromI32(18).toBigDecimal()

export const SONIC_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

export const USDC_ADDRESS = Address.fromString("0x29219dd400f2Bf60E5a23d13Be72B486D4038894");