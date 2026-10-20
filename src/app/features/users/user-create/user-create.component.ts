import { Component, output, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import type { CreateUserDto } from '../../../core/interfaces/user.interface';

/**
 * UserCreateComponent — handles only new client creation.
 * Emits 'created' on success, 'cancelled' on dismiss.
 * All HTTP calls delegated to UserService.
 */
@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.css',
})
export class UserCreateComponent {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  readonly created = output<void>();
  readonly cancelled = output<void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly form: FormGroup = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email:    ['', [Validators.required, Validators.email]],
    phone:    ['', [Validators.pattern(/^[+\d\s\-(). ]{7,20}$/)]],
    company:  ['', [Validators.maxLength(100)]],
    jobTitle: ['', [Validators.maxLength(100)]],
    address:  ['', [Validators.maxLength(200)]],
  });

  get f() { return this.form.controls; }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const dto: CreateUserDto = {
      name:     this.form.value.name.trim(),
      email:    this.form.value.email.trim(),
      phone:    this.form.value.phone?.trim()    || undefined,
      company:  this.form.value.company?.trim()  || undefined,
      jobTitle: this.form.value.jobTitle?.trim() || undefined,
      address:  this.form.value.address?.trim()  || undefined,
    };

    this.userService.create(dto).subscribe({
      next: () => { this.isSubmitting.set(false); this.created.emit(); },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Failed to create client. Please try again.');
      },
    });
  }

  onCancel(): void { this.cancelled.emit(); }
}
