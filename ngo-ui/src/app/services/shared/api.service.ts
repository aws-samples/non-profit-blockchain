
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
@Injectable()
export class ApiService {
  constructor(
    private http: HttpClient

  ) { }

  setHeaders(): HttpHeaders {
    const headersConfig = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    return new HttpHeaders(headersConfig);
  }

  setHeadersCustomer() {
    const headersConfig = {
      'Content-Type': 'application/json',
      'Token': ' bla bla '
    };
    return new Headers(headersConfig);
  }


  private formatErrors(error: any) {
    const err_msg = (error.message) ? error.message : error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    return throwError(error);
  }

  get(path: string, params: HttpParams = new HttpParams()): Observable<any> {
    // console.log(`get: ${environment.api_url}${path}`);
    return this.http.get(`${environment.api_url}${path}`, { headers: this.setHeaders(), params: params }).
      pipe(map((response: any) => response),
        catchError(this.formatErrors));
  }

  put(path: string, body: Object = {}): Observable<any> {
    // console.log(`put: ${environment.api_url}${path}`, body);
    return this.http.put(
      `${environment.api_url}${path}`,
      JSON.stringify(body),
      { headers: this.setHeaders() }
    ).pipe(map((response: any) => response),
      catchError(error => this.formatErrors(error)));
  }

  post(path: string, body: Object = {}): Observable<any> {
    // console.log(`post: ${environment.api_url}${path}`, body);
    return this.http.post(
      `${environment.api_url}${path}`,
      JSON.stringify(body),
      { headers: this.setHeaders() }
    ).pipe(map((response: any) => response),
      catchError(this.formatErrors));
  }

  delete(path): Observable<any> {
    // console.log(`Delete: ${environment.api_url}${path}`);
    return this.http.delete(
      `${environment.api_url}${path}`,
      { headers: this.setHeaders() }
    ).pipe(map((response: any) => response),
      catchError(this.formatErrors));
  }
}
