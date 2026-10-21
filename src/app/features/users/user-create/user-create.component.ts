import { Component, output, inject, signal } from '@angular/core';
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
import type { CreateUserDto } from '../../../core/interfaces/user.interface';

function noWhitespaceOnly(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value ?? '';
  return val.trim().length < 2 && val.length > 0 ? { whitespace: true } : null;
}


@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.css',
})
export class UserCreateComponent {
  private readonly userService      = inject(UserService);
  private readonly notify           = inject(NotificationService);
  private readonly fb               = inject(FormBuilder);

  readonly created   = output<void>();
  readonly cancelled = output<void>();

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

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
        Validators.pattern(/^(\+?\d[\d\s\-().]{6,18}\d)?$/),
        Validators.maxLength(10),
        Validators.minLength(10)
      ],
    ],
    age: [
      null,
      [
        Validators.min(0),
        Validators.max(120),
      ],
    ],
    address: [
      '',
      [Validators.maxLength(300)],
    ],
  });

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && (c?.touched || c?.dirty));
  }

  getError(field: string): string | null {
    const c = this.form.get(field);
    if (!c?.errors || !c?.touched) return null;
    const errors = c.errors;
    if (errors['required'])    return `${field === 'name' ? 'Name' : 'Email'} is required.`;
    if (errors['minlength'])   return `Minimum ${errors['minlength'].requiredLength} characters required.`;
    if (errors['maxlength'])   return `Maximum ${errors['maxlength'].requiredLength} characters allowed.`;
    if (errors['email'])       return 'Enter a valid email address.';
    if (errors['pattern'])     return 'Enter a valid phone number (e.g. +1 555-000-0000).';
    if (errors['min'])         return 'Age must be 0 or greater.';
    if (errors['max'])         return 'Age must be 120 or less.';
    if (errors['whitespace'])  return 'Name cannot be blank spaces.';
    return 'Invalid value.';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Please fix the highlighted fields before submitting.', 'Form Incomplete');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null)

    const dto: CreateUserDto = {
      name:    this.form.value.name.trim(),
      email:   this.form.value.email.trim().toLowerCase(),
      phone:   this.form.value.phone?.trim()   || undefined,
      age:     this.form.value.age != null ? Number(this.form.value.age) : undefined,
      address: this.form.value.address?.trim() || undefined,
    };

    this.userService.create(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notify.success(`${dto.name} has been added successfully.`, 'Client Created');
        this.created.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message ?? 'Failed to create client. Please try again.';
        this.errorMessage.set(msg)
        this.notify.error(msg, 'Creation Failed');
      },
    });
  }

  onCancel(): void { this.cancelled.emit(); }
}
