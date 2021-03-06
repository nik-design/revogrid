import {generateHeader} from "./generate-header.js";

export function generateFakeDataObject(rowsNumber, colsNumber) {
    const result = [];
    const headers = [];
    const all = colsNumber * rowsNumber;
    for (let j = 0; j < all; j++) {
        let col = j%colsNumber;
        let row = j/colsNumber|0;
        if (!result[row]) {
            result[row] = {};
        }
        result[row][col] = row + ':' + col;
        if (!headers[col]) {
            headers[col] = {
                name: generateHeader(col),
                prop: col,
                readonly: !!(col%2)
            }
        }
    }
    return {
        rows: result,
        headers: headers
    };
}

export function generateData(rowsNumber, colsNumber) {
    const result = [];
    const all = colsNumber * rowsNumber;
    for (let j = 0; j < all; j++) {
        let col = j%colsNumber;
        let row = j/colsNumber|0;
        if (!result[row]) {
            result[row] = {};
        }
        result[row][col] = row + ':' + col;
    }
    return result;
}

export function generateFakeData(rowsNumber, colsNumber) {
    const result = [];
    const rowData = [];
    const headers = [];
    for (let j = 0; j < colsNumber; j++) {
        rowData.push(j.toString());
        headers.push({
            prop: j,
            name: generateHeader(j),
            cellTemplate: (h, props) => {
                return h('div', {
                    style: {
                        backgroundColor: j%2 ? 'red' : undefined
                    },
                    class: {
                        'inner-cell': true
                    }
                }, props.model[props.prop] || '');
            }
        });
    }
    for (let i = 0; i < rowsNumber; i++) {
        result.push(rowData);
    }
    return {
        rows: result,
        headers: headers
    };
}
