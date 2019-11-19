import { Injectable, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { tap, filter } from 'rxjs/operators';
import { GtagPageview, GtagEvent, GtagConfig } from './interfaces';
import { Title } from '@angular/platform-browser';
declare var gtag: any;

@Injectable()
export class Gtag {
  private defaultConfig: GtagConfig = {
    trackingId: null,
    trackPageviews: true,
    enabled: true,
    debug: false
  };
  private mergedConfigs: GtagConfig[] = [];
  constructor(
    @Inject('configs') gtagConfigs: GtagConfig[],
    private router: Router,
    private title: Title,
    private location: Location
  ) {
    this.mergedConfigs = gtagConfigs.map(config => ({
      ...this.defaultConfig,
      ...config
    }));
    this.mergedConfigs.forEach(config => {
      if (config.trackPageviews) {
        router.events
          .pipe(
            filter(event => event instanceof NavigationEnd),
            tap(_ => {
              this.pageview({}, config.trackingId);
            })
          )
          .subscribe();
      }
    });
  }

  event(action: string, params: GtagEvent = {}, trackingId: string = null) {
    this.getConfigs(trackingId).forEach(config => {
      if (!config.enabled) {
        return;
      }
      // try/catch to avoid cross-platform issues
      try {
        gtag('event', action, params);
        this.debug(config.trackingId, 'event', action, params);
      } catch (err) {
        console.error('Google Analytics event error', err);
      }
    });
  }

  pageview(params?: GtagPageview, trackingId: string = null) {
    this.getConfigs(trackingId).forEach(config => {
      if (!config.enabled) {
        return;
      }
      try {
        const defaults = {
          page_path: this.router.url,
          page_title: this.title.getTitle(),
          page_location: this.location.prepareExternalUrl(this.location.path())
        };

        params = { ...defaults, ...params };
        gtag('config', config.trackingId, params);
        this.debug(config.trackingId, 'pageview', params);
      } catch (err) {
        console.error('Google Analytics pageview error', err);
      }
    });
  }

  config(params: any, trackingId: string = null) {
    this.getConfigs(trackingId).forEach(config => {
      try {
        gtag('config', config.trackingId, (params = {}));
      } catch (err) {
        console.error('Google Analytics config error', err);
      }
    });
  }

  set(params: any, trackingId: string = null) {
    this.getConfigs(trackingId).forEach(config => {
      try {
        gtag('set', params || {});
      } catch (err) {
        console.error('Google Analytics set error', err);
      }
    });
  }

  enable(enabled: boolean = true, trackingId: string = null) {
    this.getConfigs(trackingId).forEach(config => {
      config.enabled = enabled;
    });
  }

  private getConfigs(trackingId: string = null): GtagConfig[] {
    if (!!trackingId) {
      return [
        this.mergedConfigs.find(config => config.trackingId === trackingId)
      ];
    }
    return this.mergedConfigs;
  }

  private debug(trackingId: string, ...msg) {
    this.getConfigs(trackingId).forEach(config => {
      if (config.debug) {
        console.log('angular-gtag:', config.trackingId, ...msg);
      }
    });
  }
}
