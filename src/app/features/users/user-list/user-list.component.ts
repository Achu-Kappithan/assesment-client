import {
  Component, OnInit, OnDestroy, signal, inject, computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import type { User } from '../../../core/interfaces/user.interface';
import { UserCreateComponent } from '../user-create/user-create.component';
import { UserUpdateComponent } from '../user-update/user-update.component';

export type SortDirection = 'asc' | 'desc' | null;

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserCreateComponent, UserUpdateComponent, DatePipe],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit, OnDestroy {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  private readonly destroy$ = new Subject<void>();

  private readonly searchInput$ = new Subject<string>();

  readonly users = signal<User[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly showCreateModal = signal(false);
  readonly showUpdateModal = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly searchQuery = signal('');
  readonly deleteConfirmId = signal<string | null>(null);

  readonly ageSortDir = signal<SortDirection>(null);

  readonly displayedUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const dir = this.ageSortDir();

    // 1. Filter
    let list = this.users().filter((u) => {
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.age ?? '').includes(q)
      );
    });

    if (dir) {
      list = [...list].sort((a, b) => {
        const ageA = a.age ?? -1;
        const ageB = b.age ?? -1;
        return dir === 'asc' ? ageA - ageB : ageB - ageA;
      });
    }

    return list;
  });

  ngOnInit(): void {
    this.searchInput$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => this.searchQuery.set(value));

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load clients. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  onSearchChange(event: Event): void {
    this.searchInput$.next((event.target as HTMLInputElement).value);
  }

  toggleAgeSort(): void {
    const current = this.ageSortDir();
    if (current === null) this.ageSortDir.set('asc');
    else if (current === 'asc') this.ageSortDir.set('desc');
    else this.ageSortDir.set(null);
  }

  viewUser(id: string): void {
    this.router.navigate(['/users', id]);
  }

  openCreate(): void {
    this.showCreateModal.set(true);
  }

  openUpdate(user: User): void {
    this.selectedUser.set(user);
    this.showUpdateModal.set(true);
  }

  onUserCreated(): void {
    this.showCreateModal.set(false);
    this.loadUsers();
  }

  onUserUpdated(): void {
    this.showUpdateModal.set(false);
    this.selectedUser.set(null);
    this.loadUsers();
  }

  closeModal(): void {
    this.showCreateModal.set(false);
    this.showUpdateModal.set(false);
    this.selectedUser.set(null);
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  deleteUser(id: string): void {
    this.userService.remove(id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u._id !== id));
        this.deleteConfirmId.set(null);
      },
      error: () => {
        this.errorMessage.set('Failed to delete client.');
        this.deleteConfirmId.set(null);
      },
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
