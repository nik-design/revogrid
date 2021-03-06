/* Note: using `.d.ts` file extension will exclude it from the output build */
// import {EventEmitter} from "@stencil/core";

export type DimensionType = 'col'|'row';

export interface MultiDimensionAction {
  col: ViewSettingSizeProp;
  row: ViewSettingSizeProp;
}

export type ColumnDataSchemaModel = {
  prop: ColumnProp;
  model: DataType;
  data: DataSource;
};

export type ReadOnlyFormat = boolean | ((row: number, col: number) => boolean);
interface ColumnDataSchemaBase {
  name?: DataFormat;
  readonly?: ReadOnlyFormat;
  cellTemplate?: Function;
}
export interface ColumnDataSchemaGrouping {
  children: ColumnDataSchema[];
  name: DataFormat;
}

export interface ColumnDataSchemaRegular extends ColumnDataSchemaBase {
  prop: ColumnProp;
}

export type ColumnDataSchema = ColumnDataSchemaGrouping | ColumnDataSchemaRegular;

export type ColumnProp = string|number;
export type DataFormat = string;
export type CellTemplateFunc<T> = (h: (sel: string, data?: object, text?: string) => T, props: ColumnDataSchemaModel) => T;
export type ColumnData = ColumnDataSchema[];

export type DataType = {[T in ColumnProp]: DataFormat};
export type DataSource = DataType[];
export interface DataSourceState {
  data: DataType[];
  columns: ColumnDataSchema[];
  columnsFlat: ColumnDataSchemaRegular[];
}

export interface ViewportStateItems {
  items: VirtualPositionItem[];
  start: number;
  end: number;
}
export interface ViewportState extends ViewportStateItems {
  realCount: number;
  frameOffset: number;
  virtualSize: number;
}

export type ViewSettingSizeProp = {[index: string]: number};
export interface VirtualPositionItem extends PositionItem {
  size: number;
}

export interface PositionItem {
  itemIndex: number;
  start: number;
  end: number;
}

export interface DimensionSettingsState {
  indexes: number[];
  positionIndexes: number[];
  positionIndexToItem: {[position: number]: PositionItem};
  indexToItem: {[index: number]: PositionItem};
  sizes: ViewSettingSizeProp;
  realSize: number;
  originItemSize: number;
}

export type InitialSettings = {
  defaultColumnSize: number;
  defaultRowSize: number;
  frameSize: number;
  readonly: boolean;
  range: boolean;
  resize: boolean;
  dimensions?: {
    col?: ViewSettingSizeProp;
    row?: ViewSettingSizeProp;
  }
};


export declare namespace Selection  {
  type RowIndex = number;
  type ColIndex = number;

  type RangeArea = {
    x: ColIndex;
    y: RowIndex;
    x1: ColIndex;
    y1: RowIndex;
  };

  interface Cell {
    x: ColIndex;
    y: RowIndex;
  }

  export type RangeAreaCss = {
    left: string;
    top: string;
    width: string;
    height: string;
  };
}

export declare namespace Edition {
  type SaveData = string;
  type SaveDataDetails = {
    row: Selection.RowIndex;
    col: Selection.ColIndex;
    val: SaveData;
  };
  interface EditCell extends Selection.Cell {
    val?: SaveData;
  }
  interface EditorBase {
    // save: EventEmitter<SaveData>
  }
}