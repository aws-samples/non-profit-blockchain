import { Injectable } from '@angular/core';
import { Donor } from 'src/app/models';


@Injectable({
    providedIn: 'root'
})
export class SessionService {

    static getUser(): Donor {
        if (window.localStorage['user']) {
            try {
                const data = JSON.parse(window.localStorage['user']);
                return new Donor().get(data.name, data.email);
            } catch (error) {
                return null;
            }
        }
    }

    static getValue(key: string = '') {
        const value = window.localStorage[key];
        if (value && typeof value === 'string') {
            try {
                return JSON.parse(window.localStorage[key]);
            } catch (error) {
                // do nothing
            }
        }
        return value;
    }

    static setValue(key: string = '', value: any = null) {
        if (typeof value === 'object') {
            try {
                const data = JSON.stringify(value);
                return window.localStorage[key] = data;
            } catch (error) {
                // do nothing
            }
        }
        return window.localStorage[key] = value;
    }

    saveUser(donor: any) {
        const data = JSON.stringify(donor);
        window.localStorage['user'] = data;
    }

    deleteUser() {
        window.localStorage.removeItem('user');
    }


}
