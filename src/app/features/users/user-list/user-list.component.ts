import { Component, OnInit, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import type { User } from '../../../core/interfaces/user.interface';
import { UserCreateComponent } from '../user-create/user-create.component';
import { UserUpdateComponent } from '../user-update/user-update.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserCreateComponent, UserUpdateComponent, DatePipe],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly users = signal<User[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly showCreateModal = signal(false);
  readonly showUpdateModal = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly searchQuery = signal('');
  readonly deleteConfirmId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUsers();
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

  get filteredUsers(): User[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.company ?? '').toLowerCase().includes(q) ||
        (u.jobTitle ?? '').toLowerCase().includes(q)
    );
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

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
