import { Component, input, output, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import type { User, UpdateUserDto } from '../../../core/interfaces/user.interface';

/**
 * UserUpdateComponent — handles only editing of an existing client.
 * Receives the current user via typed input(), pre-populates the form.
 * All HTTP calls delegated to UserService.
 */
@Component({
  selector: 'app-user-update',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-update.component.html',
  styleUrl: './user-update.component.css',
})
export class UserUpdateComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  readonly user = input.required<User>();

  readonly updated = output<void>();
  readonly cancelled = output<void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form: FormGroup = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email:    ['', [Validators.required, Validators.email]],
    phone:    ['', [Validators.pattern(/^[+\d\s\-(). ]{7,20}$/)]],
    age:      [null, [Validators.min(0), Validators.max(120)]],
    jobTitle: ['', [Validators.maxLength(100)]],
    address:  ['', [Validators.maxLength(200)]],
    isActive: [true],
  });

  ngOnInit(): void {
    const u = this.user();
    this.form.patchValue({
      name:     u.name,
      email:    u.email,
      phone:    u.phone    ?? '',
      age:      u.age      ?? null,
      address:  u.address  ?? '',
      isActive: u.isActive,
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const dto: UpdateUserDto = {
      name:     this.form.value.name.trim(),
      email:    this.form.value.email.trim(),
      phone:    this.form.value.phone?.trim()    ?? '',
      age:      this.form.value.age != null ? Number(this.form.value.age) : undefined,
      address:  this.form.value.address?.trim()  ?? '',
      isActive: this.form.value.isActive,
    };

    this.userService.update(this.user()._id, dto).subscribe({
      next: () => { this.isSubmitting.set(false); this.updated.emit(); },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to update client. Please try again.');
      },
    });
  }

  onCancel(): void { this.cancelled.emit(); }
}
