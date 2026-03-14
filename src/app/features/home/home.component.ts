import { Component, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

interface Stat {
  label: string;
  target: number;
  suffix: string;
  current: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  protected authService = inject(AuthService);

  readonly isLoggedIn = () => this.authService.isLoggedIn();

  getDashboardRoute(): string {
    const roles = this.authService.getRoles();
    if (roles.includes('ADMIN')) return '/admin-dashboard';
    if (roles.includes('UNDERWRITER')) return '/underwriter-dashboard';
    if (roles.includes('CLAIMS_OFFICER')) return '/claims-dashboard';
    return '/customer-dashboard';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  stats = signal<Stat[]>([
    { label: 'Events Insured', target: 12500, suffix: '+', current: 0 },
    { label: 'Policies Issued', target: 8200, suffix: '+', current: 0 },
    { label: 'Claims Processed', target: 3400, suffix: '+', current: 0 },
    { label: 'Customer Satisfaction', target: 98, suffix: '%', current: 0 },
  ]);

  readonly taglines = [
    {
      icon: '🤖',
      title: 'AI-Powered Risk Assessment',
      description:
        'We analyze event risk using crowd size, security level, weather conditions, and infrastructure factors.',
    },
    {
      icon: '⚡',
      title: 'Instant Premium Calculation',
      description:
        'Get real-time insurance quotes tailored to your event type, size, and location.',
    },
    {
      icon: '🛡️',
      title: 'End-to-End Event Protection',
      description:
        'From underwriting approval to claims processing, we handle everything seamlessly.',
    },
  ];

  readonly workflowSteps = [
    {
      step: '01',
      icon: '📅',
      title: 'Create Event',
      description:
        'Register your event with details like venue, date, and expected attendance.',
    },
    {
      step: '02',
      icon: '📋',
      title: 'Choose Insurance Policy',
      description:
        'Select from tailored insurance plans designed for your event type.',
    },
    {
      step: '03',
      icon: '🌦️',
      title: 'Risk & Weather Analysis',
      description:
        'Our AI engine evaluates risk using weather data, crowd dynamics, and security factors.',
    },
    {
      step: '04',
      icon: '✅',
      title: 'Underwriter Approval',
      description:
        'Qualified underwriters review and approve your policy in real time.',
    },
    {
      step: '05',
      icon: '📝',
      title: 'File Claim if Needed',
      description:
        'Submit claims effortlessly if an insured event occurs.',
    },
  ];

  readonly features = [
    {
      icon: '🌤️',
      title: 'Weather-Aware Risk Engine',
      description:
        'Real-time weather data integrated into our multi-factor risk scoring system.',
    },
    {
      icon: '💰',
      title: 'Dynamic Premium Calculation',
      description:
        'Premiums computed based on venue, crowd size, security, and weather analysis.',
    },
    {
      icon: '📊',
      title: 'Underwriter Risk Dashboard',
      description:
        'Comprehensive dashboard for underwriters to review, approve, or decline policies.',
    },
    {
      icon: '📂',
      title: 'Claims Management System',
      description:
        'Streamlined digital process for filing, tracking, and resolving insurance claims.',
    },
    {
      icon: '🔐',
      title: 'Role-Based Access Control',
      description:
        'Secure, role-specific access for admins, customers, and underwriters.',
    },
    {
      icon: '🔑',
      title: 'Secure JWT Authentication',
      description:
        'Industry-standard JWT tokens ensuring secure and stateless session management.',
    },
  ];

  ngOnInit(): void {
    this.initCounterObserver();
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  scrollTo(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private initCounterObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateCounters();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    setTimeout(() => {
      const statsSection = document.getElementById('stats-section');
      if (statsSection) observer.observe(statsSection);
    }, 200);
  }

  private animateCounters(): void {
    const duration = 2000;
    const steps = 80;
    const intervalMs = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      this.stats.update((stats) =>
        stats.map((s) => ({
          ...s,
          current: Math.round(s.target * eased),
        }))
      );
      if (step >= steps) clearInterval(timer);
    }, intervalMs);
  }
}
