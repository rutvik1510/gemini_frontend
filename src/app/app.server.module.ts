import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { withRoutes } from '@angular/ssr';
import { AppModule } from './app.module';
import { App } from './app';
import { serverRoutes } from './app.routes.server';

@NgModule({
  imports: [AppModule, ServerModule],
  bootstrap: [App],
  providers: [...withRoutes(serverRoutes).ɵproviders]
})
export class AppServerModule {}
