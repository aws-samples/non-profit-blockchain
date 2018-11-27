/*
# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# or in the "license" file accompanying this file. This file is distributed
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
# express or implied. See the License for the specific language governing
# permissions and limitations under the License.
#
*/
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
        if (json) {
            const mapObj = new Map();
            Object.keys(json).forEach(key => {
                mapObj.set(key, JSON.parse(json[key]));
            });
            return mapObj;
        }
    }

    static formatFloat(floatStr: string, offset: number = 4) {
        floatStr = String(floatStr);
        try {
            const decimalIndex = floatStr.indexOf('.');
            if (decimalIndex > 0 && floatStr.length > decimalIndex + offset) {
                return parseFloat(floatStr.substring(0, decimalIndex + offset));
            }
            return parseFloat(floatStr);
        } catch (e) {
            console.error(`Cant format string ${floatStr} to float`);
            return 0.0;
        }

    }
}
