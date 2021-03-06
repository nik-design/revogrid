import {getItemByPosition} from '../dimension/dimension.helpers';
import {
  DimensionSettingsState,
  PositionItem,
  ViewportStateItems,
  ViewSettingSizeProp,
  VirtualPositionItem
} from '../../interfaces';

export type DimensionDataViewport =
    Pick<DimensionSettingsState, 'indexes'|'positionIndexes'|'positionIndexToItem'|'sizes'|'originItemSize'|'realSize'>;

type ItemsToUpdate = Pick<ViewportStateItems, 'items'|'start'|'end'>;
/**
* Update items based on new scroll position
* If viewport wasn't changed fully simple recombination of positions
* Otherwise rebuild viewport items
*/
export function getUpdatedItemsByPosition<T extends ItemsToUpdate>(
  pos: number,
  items: T,
  realCount: number,
  virtualSize: number,
  dimension: DimensionDataViewport
): ItemsToUpdate {
  const activeItem: PositionItem = getItemByPosition(dimension, pos);
  const firstItem: VirtualPositionItem = getFirstItem(items);
  let toUpdate: ItemsToUpdate;

  // do simple position replacement if items already present in viewport
  if (firstItem) {
    let changedOffsetStart: number = activeItem.itemIndex - (firstItem.itemIndex || 0);
    if (changedOffsetStart) {
      // simple recombination
      const newData: ItemsToUpdate|null = recombineByOffset(Math.abs(changedOffsetStart),{
        positiveDirection: changedOffsetStart > -1,
        ...dimension,
        ...items
      });

      if (newData) {
        toUpdate = newData;
      }

      // if partial replacement add items if revo-viewport has some space left
      if (toUpdate) {
        const extra = addMissingItems(activeItem, realCount, virtualSize, toUpdate, dimension);
        if (extra.length) {
          toUpdate.items.push(...extra);
          toUpdate.end = toUpdate.items.length - 1;
        }
      }
    }
  }

  // new collection if no items after replacement full replacement
  if (!toUpdate) {
    const items = getItems({
      start: activeItem.start,
      startIndex: activeItem.itemIndex,
      origSize: dimension.originItemSize,
      maxSize: virtualSize,
      maxCount: realCount,
      sizes: dimension.sizes
    });
    toUpdate = {
      items,
      start: items[0].itemIndex,
      end: items[items.length - 1].itemIndex
    };
  }
  return toUpdate;
}

// if partial replacement add items if revo-viewport has some space left
export function addMissingItems<T extends ItemsToUpdate> (
  firstItem: PositionItem,
  realCount: number,
  virtualSize: number,
  existingCollection: T,
  dimension: Pick<DimensionSettingsState, 'sizes'|'originItemSize'>
): VirtualPositionItem[] {
  const lastItem: VirtualPositionItem = getLastItem(existingCollection);
  const items = getItems({
    sizes: dimension.sizes,
    start: lastItem.end,
    startIndex: lastItem.itemIndex + 1,
    origSize: dimension.originItemSize,
    maxSize: virtualSize - (lastItem.end - firstItem.start),
    maxCount: realCount - 1 - lastItem.itemIndex
  });
  return items;
}

// get revo-viewport items parameters, caching position and calculating items count in revo-viewport
export function getItems(opt: {
  startIndex: number,
  start: number,
  origSize: number,
  maxSize: number,
  maxCount: number,
  sizes?: ViewSettingSizeProp,
}, currentSize: number = 0): VirtualPositionItem[] {
  const items: VirtualPositionItem[] = [];
  let index: number = opt.startIndex;
  let size: number = currentSize;
  let i: number = 0;
  while(size <= opt.maxSize && i < opt.maxCount) {
    const newSize: number = getItemSize(index, opt.sizes, opt.origSize);
    items.push({
      start: opt.start + size,
      end: opt.start + size + newSize,
      itemIndex: index,
      size: newSize
    });
    size += newSize;
    index++;
    i++;
  }
  return items;
}


/**
* Do batch items recombination
* If items not overlapped with existing viewport returns null
*/
export function recombineByOffset(
    offset: number,
    data: {
      positiveDirection: boolean,
    } &ItemsToUpdate
      &Pick<DimensionSettingsState, 'sizes'|'realSize'|'originItemSize'>
): ItemsToUpdate|null {
  const newItems = [...data.items];
  const itemsCount = newItems.length;
  let newRange = {
    start: data.start,
    end: data.end
  };

  // if offset out of revo-viewport, makes sense whole redraw
  if (offset > itemsCount) {
    return null;
  }

  // is direction of scroll positive
  if (data.positiveDirection) {
    // push item to the end
    let lastItem: VirtualPositionItem = getLastItem(data);

    let i: number = newRange.start;
    const length = i + offset;
    for (; i < length; i++) {
      const newIndex: number = lastItem.itemIndex + 1;
      const size: number = getItemSize(newIndex, data.sizes, data.originItemSize);

      // if item overlapped limit break a loop
      if (lastItem.end + size > data.realSize) {
        break;
      }

      // new item index to recombine
      let newEnd = i%itemsCount;

      // item should always present, we do not create new item, we recombine them
      if (!newItems[newEnd]) {
        throw new Error('incorrect index');
      }

      // do recombination
      newItems[newEnd] = lastItem = {
        start: lastItem.end,
        end: lastItem.end + size,
        itemIndex: newIndex,
        size: size
      };
      // update range
      newRange.start++;
      newRange.end = newEnd;
    }

  // direction is negative
  } else {
    // push item to the start
    let firstItem: VirtualPositionItem = getFirstItem(data);

    const end = newRange.end;
    for (let i = 0; i < offset; i++) {
      const newIndex: number = firstItem.itemIndex - 1;
      const size: number = getItemSize(newIndex, data.sizes, data.originItemSize);

      // new item index to recombine
      let newStart = end - i;
      newStart = (newStart < 0 ? itemsCount + newStart : newStart) % itemsCount;

      // item should always present, we do not create new item, we recombine them
      if (!newItems[newStart]) {
        throw new Error('incorrect index');
      }

      // do recombination
      newItems[newStart] = firstItem = {
        start: firstItem.start - size,
        end: firstItem.start,
        itemIndex: newIndex,
        size: size
      };
      // update range
      newRange.start = newStart;
      newRange.end--;
    }
  }
  const range = {
    start: (newRange.start < 0 ? itemsCount + newRange.start : newRange.start) % itemsCount,
    end: (newRange.end < 0 ? itemsCount + newRange.end : newRange.end) % itemsCount
  };
  return {
    items: newItems,
    ...range
  };
}


function getItemSize(index: number, sizes?: ViewSettingSizeProp, origSize: number = 0): number {
  if (sizes && sizes[index]) {
    return sizes[index];
  }
  return origSize;
}

export function isActiveRange(pos: number, item: PositionItem|undefined): boolean {
  return item && pos >= item.start && pos <= item.end;
}

export function getFirstItem(s: ItemsToUpdate): VirtualPositionItem|undefined {
  return s.items[s.start];
}

export function getLastItem(s: ItemsToUpdate): VirtualPositionItem {
  return s.items[s.end];
}

