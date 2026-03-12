import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  
  { path: 'event-details/:id', renderMode: RenderMode.Client },
  { path: 'file-claim', renderMode: RenderMode.Client },
  { path: 'file-claim/:subscriptionId', renderMode: RenderMode.Client },
  { path: 'claims-detail/:id', renderMode: RenderMode.Client },
  { path: 'underwriter-dashboard', renderMode: RenderMode.Client },
  { path: 'underwriter/subscription/:id', renderMode: RenderMode.Client },
  // Static/public routes — prerendered at build time
  { path: '**', renderMode: RenderMode.Prerender },
];
