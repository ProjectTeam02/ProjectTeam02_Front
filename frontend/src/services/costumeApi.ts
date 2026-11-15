/** 코스튬 상품·구매·보유·장착 API 계약입니다. */
import { BackendError, object } from './backend.ts';

const invalid = (): never => { throw new BackendError('코스튬 API 응답 형식이 예상과 다릅니다.', 0, 'INVALID_COSTUME_RESPONSE'); };
const str = (v: unknown): string => typeof v === 'string' ? v : invalid();
const integer = (v: unknown): number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : invalid();
const nullable = (v: unknown): string | null => v === null ? null : str(v);
const nullablePrice = (v: unknown): number | null => v === null ? null : integer(v);
const bool = (v: unknown): boolean => typeof v === 'boolean' ? v : invalid();
const array = <T>(v: unknown, decode: (item: unknown) => T): T[] => Array.isArray(v) ? v.map(decode) : invalid();

export interface Costume {
  itemId: string; costumeCode: string; name: string; description: string | null; flavorText: string | null;
  category: string; priceCoin: number | null; imageKey: string | null; thumbnailKey: string | null;
  isOnSale: boolean; owned: boolean; equipped: boolean;
}
export const costumeDecoder = (value: unknown): Costume => {
  const d = object(value);
  return { itemId: str(d.itemId), costumeCode: str(d.costumeCode), name: str(d.name),
    description: nullable(d.description), flavorText: nullable(d.flavorText), category: str(d.category),
    priceCoin: nullablePrice(d.priceCoin), imageKey: nullable(d.imageKey), thumbnailKey: nullable(d.thumbnailKey),
    isOnSale: bool(d.isOnSale), owned: bool(d.owned), equipped: bool(d.equipped) };
};
export interface CostumeList { items: Costume[]; page: number; size: number; total: number }
export const costumesDecoder = (value: unknown): CostumeList => {
  const d = object(value);
  return { items: array(d.items, costumeDecoder), page: integer(d.page), size: integer(d.size), total: integer(d.total) };
};
export interface CostumePurchase { purchaseId: string; itemId: string; coinBalance: number; duplicate?: boolean }
export const purchaseDecoder = (value: unknown): CostumePurchase => {
  const d = object(value);
  return { purchaseId: str(d.purchaseId), itemId: str(d.itemId), coinBalance: integer(d.coinBalance),
    duplicate: d.duplicate === undefined ? undefined : bool(d.duplicate) };
};

export interface CostumeInventory { items: Costume[]; equipped: { category: string; itemId: string }[] }
export const inventoryDecoder = (value: unknown): CostumeInventory => {
  const d = object(value);
  return { items: array(d.items, costumeDecoder), equipped: array(d.equipped, value => {
    const item = object(value);
    return { category: str(item.category), itemId: str(item.itemId) };
  }) };
};
export const equipDecoder = (value: unknown) => {
  const d = object(value);
  return { category: str(d.category), itemId: str(d.itemId) };
};

export const COSTUME_PATHS = {
  shop: '/api/v1/shop/costumes',
  detail: (itemId: string) => `/api/v1/shop/costumes/${encodeURIComponent(itemId)}`,
  purchase: '/api/v1/shop/purchases',
  inventory: '/api/v1/inventory',
};
export const equipCostumePath = (itemId: string) => `/api/v1/inventory/${encodeURIComponent(itemId)}/equip`;