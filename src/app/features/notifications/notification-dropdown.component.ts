import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="relative">
      <!-- Bell Icon -->
      <button (click)="toggleDropdown()" class="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-100">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        @if (service.unreadCount() > 0) {
          <span class="absolute top-1 right-1 flex h-4 w-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold text-white items-center justify-center">
              {{ service.unreadCount() }}
            </span>
          </span>
        }
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div class="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div class="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider">Notifications</h3>
            <button (click)="markAllAsRead()" class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tighter">Mark all as read</button>
          </div>

          <div class="max-h-[400px] overflow-y-auto">
            @if (service.notifications().length === 0) {
              <div class="p-10 text-center">
                <p class="text-xs text-slate-400 font-medium">No notifications yet.</p>
              </div>
            }

            @for (n of service.notifications(); track n.id) {
              <div (click)="markAsRead(n)" 
                [class]="'p-4 border-b border-slate-50 cursor-pointer transition-colors ' + (n.isRead ? 'opacity-60 bg-white' : 'bg-indigo-50/30 hover:bg-indigo-50')">
                <div class="flex items-start gap-3">
                  <div [class]="'mt-1 w-2 h-2 rounded-full shrink-0 ' + (n.type === 'ALERT' ? 'bg-red-500' : n.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-blue-500')"></div>
                  <div class="flex-1">
                    <p [class]="'text-xs font-medium leading-relaxed ' + (n.isRead ? 'text-slate-500' : 'text-slate-800 font-bold')">{{ n.message }}</p>
                    <p class="text-[10px] text-slate-400 mt-1 font-bold">{{ n.createdAt | date:'shortTime' }} • {{ n.createdAt | date:'dd MMM' }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class NotificationDropdownComponent {
  readonly service = inject(NotificationService);
  readonly isOpen = signal(false);

  constructor() {
    this.service.loadNotifications();
  }

  toggleDropdown() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.service.loadNotifications();
    }
  }

  markAsRead(n: any) {
    if (!n.isRead) {
      this.service.markAsRead(n.id).subscribe();
    }
  }

  markAllAsRead() {
    this.service.markAllAsRead().subscribe();
  }
}
