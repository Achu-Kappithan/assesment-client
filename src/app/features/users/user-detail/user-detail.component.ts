import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { User } from '../../../core/interfaces/user.interface';
import { UserUpdateComponent } from '../user-update/user-update.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [DatePipe, UserUpdateComponent],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css',
})
export class UserDetailComponent implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly userService = inject(UserService);
  private readonly notify      = inject(NotificationService);

  readonly user         = signal<User | null>(null);
  readonly isLoading    = signal(true);
  readonly errorMessage = signal('');
  readonly showEditModal = signal(false);

  readonly initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/users']);
      return;
    }
    this.fetchUser(id);
  }

  fetchUser(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.userService.getById(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Client not found or could not be loaded.');
        this.isLoading.set(false);
        this.notify.error('Client not found or could not be loaded.', 'Load Error');
      },
    });
  }

  goBack(): void { this.router.navigate(['/users']); }

  openEdit(): void { this.showEditModal.set(true); }

  onUserUpdated(): void {
    this.showEditModal.set(false);
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.fetchUser(id);
    // Toast fired inside UserUpdateComponent
  }

  onEditCancelled(): void { this.showEditModal.set(false); }

  /** Swal confirm dialog — no custom HTML modal needed */
  async deleteUser(): Promise<void> {
    const name = this.user()?.name ?? 'this client';
    const confirmed = await this.notify.confirmDelete(name);
    if (!confirmed) return;

    const id = this.user()?._id;
    if (!id) return;

    this.userService.remove(id).subscribe({
      next: () => {
        this.notify.success(`${name} has been deleted.`, 'Deleted');
        this.router.navigate(['/users']);
      },
      error: () => {
        this.notify.error('Failed to delete client. Please try again.', 'Delete Failed');
      },
    });
  }
}
