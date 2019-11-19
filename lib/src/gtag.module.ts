import { NgModule, ModuleWithProviders } from '@angular/core';
import { Gtag } from './gtag.service';
import { GtagEventDirective } from './gtag-event.directive';
import { GtagConfig } from './interfaces';

@NgModule({
  declarations: [GtagEventDirective],
  exports: [GtagEventDirective]
})
export class GtagModule {
  public static forRoot(configs: GtagConfig[]): ModuleWithProviders {
    return {
      ngModule: GtagModule,
      providers: [Gtag, { provide: 'configs', useValue: configs }]
    };
  }
}
