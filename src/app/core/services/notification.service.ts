import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

/**
 * NotificationService — centralises all SweetAlert2 calls.
 *
 * Single Responsibility Principle:
 *  - Components never import Swal directly
 *  - All toast config, theming & icon logic lives here
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  /** ── Toasts ─────────────────────────────────────────────────────────────── */

  success(message: string, title = 'Success'): void {
    this.Toast.fire({ icon: 'success', title, text: message });
  }

  error(message: string, title = 'Error'): void {
    this.Toast.fire({ icon: 'error', title, text: message });
  }

  warning(message: string, title = 'Warning'): void {
    this.Toast.fire({ icon: 'warning', title, text: message });
  }

  info(message: string, title = 'Info'): void {
    this.Toast.fire({ icon: 'info', title, text: message });
  }

  /** ── Confirm Dialogs ────────────────────────────────────────────────────── */

  /**
   * Shows a delete-confirmation dialog.
   * @returns Promise<boolean> — true if user clicked "Yes, delete"
   */
  async confirmDelete(itemName: string): Promise<boolean> {
    const result: SweetAlertResult = await Swal.fire({
      title: 'Delete Client?',
      html: `Are you sure you want to delete <strong>${itemName}</strong>?<br>
             <span style="font-size:13px;color:#64748b;">This action cannot be undone.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup:          'swal-popup',
        title:          'swal-title',
        confirmButton:  'swal-btn-danger',
        cancelButton:   'swal-btn-cancel',
      },
    });
    return result.isConfirmed;
  }

  /**
   * Generic confirmation dialog.
   * @returns Promise<boolean> — true if confirmed
   */
  async confirm(title: string, text: string, confirmLabel = 'Yes'): Promise<boolean> {
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: confirmLabel,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    return result.isConfirmed;
  }
}
