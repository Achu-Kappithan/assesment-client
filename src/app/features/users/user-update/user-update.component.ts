import { Component, input, output, inject, signal, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { User, UpdateUserDto } from '../../../core/interfaces/user.interface';

// ── Custom Validator (same as create) ─────────────────────────────────────────
function noWhitespaceOnly(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value ?? '';
  return val.trim().length < 2 && val.length > 0 ? { whitespace: true } : null;
}

@Component({
  selector: 'app-user-update',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-update.component.html',
  styleUrl: './user-update.component.css',
})
export class UserUpdateComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly notify      = inject(NotificationService);
  private readonly fb          = inject(FormBuilder);

  readonly user = input.required<User>();

  readonly updated   = output<void>();
  readonly cancelled = output<void>();

  readonly isSubmitting = signal(false);

  readonly form: FormGroup = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
        noWhitespaceOnly,
      ],
    ],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(150),
      ],
    ],
    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(\+?\d[\d\s\-().]{6,18}\d)?$/),
        Validators.maxLength(10),
        Validators.minLength(10)
      ],
    ],
    age: [
      null,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(120),
      ],
    ],
    address: [
      '',
      [Validators.maxLength(300),
        Validators.required
      ],
    ],
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
    return !!(c?.invalid && (c?.touched || c?.dirty));
  }

 getError(field: string): string | null {
    const c = this.form.get(field);
    if (!c?.errors || (!c?.touched && !c?.dirty)) return null;
    
    const errors = c.errors;
    if (errors['required'])     return `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`;
    if (errors['minlength'])    return `Minimum ${errors['minlength'].requiredLength} characters required.`;
    if (errors['maxlength'])    return `Maximum ${errors['maxlength'].requiredLength} characters allowed.`;
    if (errors['email'])        return 'Enter a valid email address.';
    if (errors['pattern'])      return 'Enter a valid phone number (e.g. +1 555-000-0000).';
    if (errors['min'])          return 'Age must be 0 or greater.';
    if (errors['max'])          return 'Age must be 120 or less.';
    if (errors['whitespace'])   return 'Name cannot be blank spaces.';
    return 'Invalid value.';
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Please fix the highlighted fields before submitting.', 'Form Incomplete');
      return;
    }

    this.isSubmitting.set(true);
    

    const dto: UpdateUserDto = {
      name:     this.form.value.name.trim(),
      email:    this.form.value.email.trim().toLowerCase(),
      phone:    this.form.value.phone?.trim()   ?? '',
      age:      this.form.value.age != null ? Number(this.form.value.age) : undefined,
      address:  this.form.value.address?.trim() ?? '',
      isActive: this.form.value.isActive,
    };

    this.userService.update(this.user()._id, dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notify.success(`${dto.name}'s profile has been updated.`, 'Client Updated');
        this.updated.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message ?? 'Failed to update client. Please try again.';
        this.notify.error(msg, 'Update Failed');
      },
    });
  }

  onCancel(): void { this.cancelled.emit(); }
}
