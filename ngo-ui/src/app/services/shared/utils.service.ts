import { Injectable } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class UtilsService {

    static onHeightChange(elementtoResize, offset: number = 50) {
        const x = $(elementtoResize).offset();
        const setElementHtTo = $(window).height() - x.top - offset;
        $(elementtoResize).css({ 'max-height': setElementHtTo });
    }

    static mapToJson(map) {
        const josnObj = {};
        Array.from(map.entries()).forEach(entry => {
            josnObj[entry[0]] = JSON.stringify(entry[1]);
        });
        return josnObj;
    }

    static jsonToMap(json) {
        const mapObj = new Map();
        Object.keys(json).forEach(key => {
            mapObj.set(key, JSON.parse(json[key]));
        });
        return mapObj;
    }

    static formatFloat(floatStr: string, offset: number = 4) {
        floatStr = String(floatStr);
        try {
            const decimalIndex = floatStr.indexOf('.');
            if (decimalIndex > 0 && floatStr.length > decimalIndex + offset) {
                return parseFloat(floatStr.substring(floatStr.indexOf('.'), floatStr.indexOf('.') + offset));
            }
            return parseFloat(floatStr);
        } catch (e) {
            console.error(`Cant format string ${floatStr} to float`);
            return 0.0;
        }

    }
}
