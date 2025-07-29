import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl
} from '@angular/forms';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger
} from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { Renderer2, ChangeDetectorRef } from '@angular/core';
import { debounceTime, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css'],
  animations: [
    trigger('fabAnimation', [
      transition(':enter', [
        query('.fab-btn', [
          style({ opacity: 0, transform: 'scale(0.8)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
          ])
        ])
      ])
    ])
  ]
})
export class EmployeeComponent implements OnInit {
filteredEmployees: any;
nameSuggestions: string[][] = [[]]; // One array per employee row
employeeGroup: any;
i: number | undefined;
  employeeForm: FormGroup;
  isDarkMode = false;
  designation = ['Intern','Junior Developer','Software Engineer','Senior Software Engineer','Team Lead','Project Manager','QA Analyst','QA Lead','DevOps Engineer','HR Executive','HR Manager']
  departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing'];
  employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary'];
name: unknown;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef
  ) {
    this.employeeForm = this.fb.group({
      employees: this.fb.array([this.createEmployeeGroup()]),
      noticePeriod: [false],
      probationPeriod: [false],
      projectName: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]],
      projectManagerName: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]],
      projectManagerEmail: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/)]],
      teamLeadName: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]],
      teamLeadEmail: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/)]],
      projectManagementOfficeName: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]],
      projectManagementOfficeEmail: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/)]],
      projectStartDate: ['', Validators.required],
      projectEndDate: ['', Validators.required],
    });
  }

  get employees(): FormArray {
    return this.employeeForm.get('employees') as FormArray;
  }

  createEmployeeGroup(): FormGroup {
    const group = this.fb.group({
      employeeName: ['', [Validators.required, Validators.pattern(/^[A-Za-z\s]+$/)]],
      employeeId: ['', Validators.required],
      joiningDate: ['', Validators.required],
      employeeEmail: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/)]],
      department: ['', Validators.required],
      employmentType: ['', Validators.required],
      designation: ['', Validators.required]
    });

    // Add autocomplete behavior
    group.get('employeeName')!.valueChanges.pipe(
      debounceTime(300),
      switchMap(value => (typeof value === 'string' && value.length >= 2) ? this.searchEmployee(value) : of(null))
    ).subscribe(data => {
      if (data) {
        // Only auto-fill if a full match is returned
        this.fillEmployeeData(group, data);
      }
    });

    return group;
  }

  searchEmployee(query: string) {
    return this.http.get<any>(`https://localhost:5000/employees/search?query=${query}`);
  }

  fillEmployeeData(group: FormGroup, data: any): void {
    group.patchValue({
      employeeId: data.employeeId,
      joiningDate: data.joiningDate,
      employeeEmail: data.employeeEmail,
      department: data.department,
      employmentType: data.employmentType,
      designation: data.designation
    });
  }

  addEmployee() {
    const lastGroup = this.employees.at(this.employees.length - 1) as FormGroup;
    lastGroup.markAllAsTouched();

    if (lastGroup.invalid) {
      this.scrollToFirstError();
      return;
    }

    this.employees.push(this.createEmployeeGroup());
    this.nameSuggestions.push([]); 

    setTimeout(() => {
      const selects = document.querySelectorAll('select');
      selects.forEach((el: any) => {
        el.style.display = 'none';
        void el.offsetHeight;
        el.style.display = '';
      });
      this.cdRef.detectChanges();
    }, 100);
  }

  deleteEmployee(index: number): void {
    if (this.employees.length > 1) {
      this.employees.removeAt(index);
    } else {
      alert('At least one employee section is required.');
    }
  }

  saveEmployee(index: number): void {
    const employeeGroup = this.employees.at(index) as FormGroup;
    Object.keys(employeeGroup.controls).forEach(controlName => {
      const control = employeeGroup.get(controlName);
      control?.markAsTouched();
    });

    const containers = document.querySelectorAll('.employee-section-box');
    const Container = containers[index] as HTMLElement | null;

    if (employeeGroup.invalid) {
      if (Container) {
        const firstInvalid = Container.querySelector('.ng-invalid') as HTMLElement | null;
        if (firstInvalid) {
          setTimeout(() => {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalid.focus();
          }, 0);
        }
      }
      return;
    }

    const employeeData = employeeGroup.value;
    this.http.post('https://localhost:5000/employees', employeeData).subscribe({
      next: () => alert(`Employee ${index + 1} saved successfully!`),
      error: err => alert('Error saving employee: ' + err.message)
    });
  }

  onSubmit() {
    this.employeeForm.markAllAsTouched();
    this.employees.controls.forEach(group => group.markAllAsTouched());

    if (this.employeeForm.valid) {
      this.http.post('https://localhost:5000/employees', this.employeeForm.value).subscribe({
        next: () => alert('Data submitted to server successfully!'),
        error: err => alert('Error submitting data: ' + err.message)
      });
    } else {
      this.scrollToFirstError();
    }
  }

  scrollToFirstError(): void {
    const employeeContainers = document.querySelectorAll('.employee-section-box');
    for (let i = 0; i < employeeContainers.length; i++) {
      const container = employeeContainers[i];
      const invalidControl = container.querySelector('.ng-invalid') as HTMLElement | null;
      if (invalidControl) {
        setTimeout(() => {
          invalidControl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          invalidControl.focus();
        }, 0);
        return;
      }
    }

    const firstInvalid = document.querySelector('.ng-invalid') as HTMLElement | null;
    if (firstInvalid) {
      setTimeout(() => {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }, 0);
    }
  }

  onReset(): void {
    location.reload();
  }

  onExit() {
    alert('Exit clicked');
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    const root = document.documentElement;
    if (this.isDarkMode) {
      root.classList.add('dark-mode', 'dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark-mode', 'dark-theme');
      localStorage.setItem('theme', 'light');
    }

    setTimeout(() => {
      const selects = document.querySelectorAll('select');
      selects.forEach((el: any) => {
        el.style.display = 'none';
        void el.offsetHeight;
        el.style.display = '';
      });
      this.cdRef.detectChanges();
    }, 100);
  }

  ngOnInit() {
    const themePref = localStorage.getItem('theme');
    if (themePref === 'dark') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark-mode', 'dark-theme');
    } else {
      this.isDarkMode = false;
      document.documentElement.classList.remove('dark-mode', 'dark-theme');
    }

    this.nameSuggestions = [[]];

    setTimeout(() => this.cdRef.detectChanges(), 0);
  }
  

  // nameSuggestions declaration moved to the top with correct type

onNameInput(inputValue: string, index: number): void {
  this.http.get<string[]>(`https://localhost:5000/employees/suggestions?query=${inputValue}`)
    .subscribe((suggestions) => {
      this.nameSuggestions[index] = suggestions;
    });
}

onNameSelected(selectedName: string, index: number): void {
  const employeeGroup = this.employees.at(index) as FormGroup;
  this.http.get<any>(`https://localhost:5000/employees/details?name=${selectedName}`)
    .subscribe(data => {
      employeeGroup.patchValue({
        employeeName: data.employeeName,
        employeeId: data.employeeId,
        joiningDate: data.joiningDate,
        employeeEmail: data.employeeEmail,
        employmentType: data.employmentType,
        designation: data.designation,
        department: data.department
      });
    });
}

}

