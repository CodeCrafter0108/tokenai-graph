import {
  E_18,
  ONE_BI,
  SECONDS_PER_DAY,
  SECONDS_PER_6HOUR,
  SECONDS_PER_HOUR,
  SECONDS_PER_5MIN,
  ZERO_BD,
  ZERO_BI,
} from "./constants";
import { Token24hData, Token, TokenPrice6h, TokenPriceHour, TokenPrice5m } from "../generated/schema";
import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function GetTimeId(timestamp: i32, seconds: i32): i32 {
  return timestamp / seconds;
}


function Initialize24hData(
  token24hData: Token24hData,
  timestamp: i32,
  tokenId: string
): void {
  let dayID = GetTimeId(timestamp, SECONDS_PER_DAY);
  token24hData.date = dayID * 86400;
  token24hData.token = tokenId;
  token24hData.buys24h = ZERO_BI;
  token24hData.sells24h = ZERO_BI;
  token24hData.buyVolumeUsd24h = ZERO_BD;
  token24hData.sellVolumeUsd24h = ZERO_BD;
  token24hData.sellers24h = [];
  token24hData.buyers24h = [];
}

export function UpdateToken24hData(
  token: Token,
  event: ethereum.Event,
  amount: BigInt,
  priceUSD: BigDecimal,
  isSell: boolean,
): void {
  let timestamp = event.block.timestamp.toI32();
  let user = event.transaction.from;
  let dayID = GetTimeId(timestamp, SECONDS_PER_DAY);
  let tokenDayID = token.id
    .toString()
    .concat("-")
    .concat(BigInt.fromI32(dayID).toString());

  let token24hData = Token24hData.load(tokenDayID);
  if (token24hData === null) {
    token24hData = new Token24hData(tokenDayID);
    Initialize24hData(token24hData, timestamp, token.id);
  }

  if (isSell) {
    token24hData.sells24h = token24hData.sells24h.plus(ONE_BI);
    token24hData.sellVolumeUsd24h = token24hData.sellVolumeUsd24h.plus(
      amount.toBigDecimal().div(E_18).times(priceUSD)
    );
    let sellersArray = token24hData.sellers24h;
    if (sellersArray === null) {
      sellersArray = [];
    }
    if (!sellersArray.includes(user)) {
      sellersArray.push(user);
    }
    token24hData.sellers24h = sellersArray;
  } else {
    token24hData.buys24h = token24hData.buys24h.plus(ONE_BI);
    token24hData.buyVolumeUsd24h = token24hData.buyVolumeUsd24h.plus(
      amount.toBigDecimal().div(E_18).times(priceUSD)
    );
    let buyersArray = token24hData.buyers24h;
    if (buyersArray === null) {
      buyersArray = [];
    }
    if (!buyersArray.includes(user)) {
      buyersArray.push(user);
    }
    token24hData.buyers24h = buyersArray;
  }
  token24hData.price = priceUSD;
  token24hData.save();
}

export function UpdateTokenPrice6h(
  token: Token,
  event: ethereum.Event,
  priceUSD: BigDecimal,

): void {
  let timestamp = event.block.timestamp.toI32();
  let timeId = GetTimeId(timestamp, SECONDS_PER_6HOUR);
  let token6hID = token.id
    .toString()
    .concat("-")
    .concat(BigInt.fromI32(timeId).toString());

  let price6hData = TokenPrice6h.load(token6hID);
  if (price6hData  === null) {
    price6hData  = new TokenPrice6h(token6hID);
  }

  price6hData.token = token.id;
  price6hData.price = priceUSD;
  price6hData.date = timestamp;
 
  price6hData.save();
}

export function UpdateTokenPriceHour(
  token: Token,
  event: ethereum.Event,
  priceUSD: BigDecimal,

): void {
  let timestamp = event.block.timestamp.toI32();
  let timeId = GetTimeId(timestamp, SECONDS_PER_HOUR);
  let tokenHourID = token.id
    .toString()
    .concat("-")
    .concat(BigInt.fromI32(timeId).toString());

  let priceHourData = TokenPriceHour.load(tokenHourID);
  if (priceHourData  === null) {
    priceHourData  = new TokenPriceHour(tokenHourID);
  }

  priceHourData.token = token.id;
  priceHourData.price = priceUSD;
  priceHourData.date = timestamp;
 
  priceHourData.save();
}

export function UpdateTokenPrice5minute(
  token: Token,
  event: ethereum.Event,
  priceUSD: BigDecimal,

): void {
  let timestamp = event.block.timestamp.toI32();
  let timeId = GetTimeId(timestamp, SECONDS_PER_5MIN);
  let token5mID = token.id
    .toString()
    .concat("-")
    .concat(BigInt.fromI32(timeId).toString());

  let price5mData = TokenPrice5m.load(token5mID);
  if (price5mData  === null) {
    price5mData  = new TokenPrice5m(token5mID);
  }

  price5mData.token = token.id;
  price5mData.price = priceUSD;
  price5mData.date = timestamp;
 
  price5mData.save();
}
