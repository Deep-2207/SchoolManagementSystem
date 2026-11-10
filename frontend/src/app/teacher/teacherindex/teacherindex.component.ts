import { Component, OnInit } from '@angular/core';
import { TeacherService } from './teacher.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartmentService } from '../../department/departmentindex/department.service';

@Component({
  selector: 'app-teacherindex',
  templateUrl: './teacherindex.component.html',
  styleUrl: './teacherindex.component.scss'
})
export class TeacherindexComponent implements OnInit {
  constructor(
    private service: TeacherService, 
    private departmentService: DepartmentService,
    private fb: FormBuilder
  ) { }

  public data: any[] = [];
  public departments: any[] = [];
  isUpdate = false;
  isInsert = false;
  public selectedTeacher: any = null;
  
  teacherForm: FormGroup;

  ngOnInit(): void {
    this.getAllData();
    this.loadDepartments();
    this.initializeForm();
  }

  initializeForm() {
    this.teacherForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      departmentId: [null],
      isSuperAdmin: [false],
      isActive: [true]
    });
  }

  loadDepartments() {
    this.departmentService.getDepartmentAll().subscribe({
      next: (res) => {
        this.departments = res || [];
      },
      error: (err) => console.error('Error loading departments:', err)
    });
  }

  openInsertDialog() {
    this.isInsert = true;
    this.teacherForm.reset({
      name: '',
      email: '',
      password: '',
      departmentId: null,
      isSuperAdmin: false,
      isActive: true
    });
    this.teacherForm.enable();
  }

  closeInsertDialog() {
    this.isInsert = false;
    this.teacherForm.reset();
  }

  getAllData() {
    this.service.getTeacherAll().subscribe({
      next: (response) => {
        this.data = response as any[];
      },
      error: (error) => {
        console.error('Error loading teacher data:', error);
        this.data = [];
      }
    });
  }
  
  openUpdateDialog(teacher: any) {
    this.isUpdate = true;
    this.selectedTeacher = teacher;
    this.teacherForm.patchValue({
      name: teacher.name || '',
      email: teacher.email || '',
      password: '',
      departmentId: teacher.departmentId || null,
      isSuperAdmin: teacher.isSuperAdmin || false,
      isActive: teacher.isActive !== false
    });
    this.teacherForm.enable();
  }

  saveTeacher() {
    if (!this.teacherForm.value.name || !this.teacherForm.value.email) {
      alert('Please fill in full name and email.');
      return;
    }

    let model: any = {
      id: this.selectedTeacher.id,
      name: this.teacherForm.value.name.trim(),
      email: this.teacherForm.value.email.trim(),
      password: this.teacherForm.value.password || this.selectedTeacher.password,
      departmentId: this.teacherForm.value.departmentId ? Number(this.teacherForm.value.departmentId) : null,
      isSuperAdmin: !!this.teacherForm.value.isSuperAdmin,
      isActive: this.teacherForm.value.isActive !== false
    };

    const isEmailExists = this.data.some(teacher => teacher.email.toLowerCase() === model.email.toLowerCase() && teacher.id !== model.id);
    if (isEmailExists) {
      alert('This email address is already in use by another account.');
      return;
    }

    this.service.updateTeacher(model).subscribe({
      next: (response) => {
        if (response) {
          this.getAllData();
          this.isUpdate = false;
          this.teacherForm.reset();
        }
      },
      error: (error) => {
        console.error('Error updating teacher:', error);
        alert(`Error updating faculty member: ${error.message || 'Please check input'}`);
      }
    });
  }

  deleteTeacher(teacher: any) {
    if (!confirm(`Are you sure you want to remove faculty account "${teacher.name}"?`)) {
      return;
    }
    this.selectedTeacher = teacher;
    this.service.deleteTeacher(this.selectedTeacher.id).subscribe({
      next: (response) => {
        if (response) {
          this.getAllData();
        }
      },
      error: (error) => {
        console.error('Error deleting teacher:', error);
        alert('Error removing faculty member.');
      }
    });
  }

  insertTeacher() {
    if (!this.teacherForm.value.password || this.teacherForm.value.password.trim() === '') {
      alert('Password is required for a new faculty member.');
      return;
    }
    
    let model = {
      name: this.teacherForm.value.name.trim(),
      email: this.teacherForm.value.email.trim(),
      password: this.teacherForm.value.password.trim(),
      departmentId: this.teacherForm.value.departmentId ? Number(this.teacherForm.value.departmentId) : null,
      isSuperAdmin: !!this.teacherForm.value.isSuperAdmin,
      isActive: this.teacherForm.value.isActive !== false
    };

    const isEmailExists = this.data.some(teacher => teacher.email.toLowerCase() === model.email.toLowerCase());
    if (isEmailExists) {
      alert('This email address is already registered.');
      return;
    }

    this.service.insertTeacher(model).subscribe({
      next: (response) => {
        if (response > 0) {
          this.getAllData();
          this.closeInsertDialog();
        } else {
          alert('Failed to provision teacher.');
        }
      },
      error: (error) => {
        console.error('Error inserting teacher:', error);
        alert(`Failed to create teacher: ${error.message || 'Check details'}`);
      }
    });
  }
}
