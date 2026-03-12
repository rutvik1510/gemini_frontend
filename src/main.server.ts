import { BootstrapContext } from '@angular/platform-browser';
import { ApplicationRef } from '@angular/core';
import { AppServerModule } from './app/app.server.module';

const bootstrap = (context: BootstrapContext) =>
    context.platformRef
        .bootstrapModule(AppServerModule)
        .then((moduleRef) => moduleRef.injector.get(ApplicationRef));

export default bootstrap;
