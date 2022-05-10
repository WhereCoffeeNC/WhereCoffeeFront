import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from 'src/app/model/user/user';
import { AuthService } from '../../service/auth/auth.service';
import { UserService } from '../../service/user/user.service'
import { environment } from 'src/environments/environment';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CoffeeShop } from 'src/app/model/coffeeShop/coffee-shop';
import { CoffeeShopService } from 'src/app/service/coffeeShops/coffee-shop.service';
import { CoffeeShopDetailsForUserComponent } from '../nearby-cafeterias/coffee-shop-details-for-user/coffee-shop-details-for-user.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  hidePasswords!: boolean;
  showMainPage!: boolean
  successfullUpdate!: boolean;
  form!: FormGroup;
  user!: User | null;

  constructor(
    private formBuilder: FormBuilder, 
    private http: HttpClient, 
    private router: Router, 
    private coffeeShopService: CoffeeShopService,
    private modalService: NgbModal,
    private authService: AuthService,
    private userService: UserService,
    private toastr: ToastrService) { }

  ngOnInit(): void {
    this.showMainPage = true;
    this.successfullUpdate = false;
    this.hidePasswords = true;
    this.userService.getData(this.authService.user!.id).subscribe(
      (userData: User) => {
        this.user = userData;
        console.log("This user: ", this.user)
        this.buildForm()
      },
      (err: any) => {
        this.toastr.error('Время действия сессии истекло. Необохдимо заново авторизироваться')
        this.router.navigate(['/login']);
      }
    )
    
  }
  private buildForm() {
    let date;
    if (this.user?.birthDay != null) {
      date = this.user?.birthDay.toString().substring(0,10);
    }
    else date = '';
    this.form = this.formBuilder.group({
      firstName: [this.user?.firstName],
      surname: [this.user?.surname],
      patronymic: [this.user?.patronymic],
      email: [this.user?.email, [Validators.required, Validators.email]],
      phone: [this.user?.phone, [Validators.pattern(/(?:(\+d)|\d)[\d\-\(\) ]{10,}/)]],
      birthDay: [date],
      oldPassword: ['', [Validators.pattern("[0-9a-zA-Z!@#$%^&*]{6,}")]],
      newPassword: ['', [Validators.pattern("[0-9a-zA-Z!@#$%^&*]{6,}")]],
      confirmPassword: ['', [Validators.pattern("[0-9a-zA-Z!@#$%^&*]{6,}")]]
    })
  }
  
  get getEmail() {
    return this.form.get("email");
  }
  get getPhone() {
    return this.form.get("phone");
  }
  get getOldPassword() {
    return this.form.get('oldPassword');
  }
  get getNewPassword() {
    return this.form.get('newPassword');
  }
  get getConfirmPassword() {
    return this.form.get('confirmPassword');
  }
  get passwordsMatch(): boolean {
    return this.getConfirmPassword?.value === this.getNewPassword?.value
  }
  get getSuccessfullUpdate() {
    return this.successfullUpdate;
  }
  
  private resetPasswords() {
    this.form.get('newPassword')?.setValue(null)
    this.form.get('oldPassword')?.setValue(null)
    this.form.get('confirmPassword')?.setValue(null)
    this.form.get('newPassword')?.markAsPristine()
    this.form.get('oldPassword')?.markAsPristine()
    this.form.get('confirmPassword')?.markAsPristine()
  }

  submit(): void {
    if (!this.passwordsMatch || !this.form.valid) {
      console.log('form is invalid')
      
    }
    else {
      let userData = JSON.parse(localStorage.getItem('userData')!)
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${userData.token}`
      })
      this.http.patch<User>(environment.apiUrl + '/users/'+this.user?.id, this.form.getRawValue(), {headers: headers})
      .subscribe(
        (res: any) => {
          this.successfullUpdate = true;
          this.user = res;
          this.resetPasswords()
        },
        (err: HttpErrorResponse) => {
          console.log(err);
          if (err.status == 409) {
            alert('The old password may have been entered incorrectly!')
          }
          this.resetPasswords()
        }
      )
    }
  }

  openCoffeeShopModalDetails(coffeeShop: CoffeeShop) {
    let ngbModalOptions: NgbModalOptions = {
      backdrop : true,
      keyboard : false,

      size: 'xl'
    }

    this.coffeeShopService.getCoffeeShop(coffeeShop.id, false).subscribe( 
      (coffeeShop) => {
        const modalRef: NgbModalRef = this.modalService.open(CoffeeShopDetailsForUserComponent, ngbModalOptions);
        console.log("ModalRef:", modalRef);

        modalRef.componentInstance.coffeeShop = coffeeShop;
        console.log("Getting coffee shop", coffeeShop);

        modalRef.result.then( (result) => {
          console.log("Coffee shop for user Modal window is closed")
        })
        .catch(error => console.log(error))
    })
  }
}
