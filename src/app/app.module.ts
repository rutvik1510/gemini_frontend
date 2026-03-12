import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { App } from './app';
import { LoginComponent } from './features/login/login.component';
import { authInterceptor } from './core/auth.interceptor';

@NgModule({
  declarations: [App],
  imports: [BrowserModule, AppRoutingModule, LoginComponent],
  providers: [provideHttpClient(withFetch(), withInterceptors([authInterceptor]))],
  bootstrap: [App]
})
export class AppModule {}
