import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { CallserviceService } from '../services/callservice.service';
import { CartService } from '../services/cart.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  constructor(
    private formBuilder: FormBuilder,
    private callService: CallserviceService,

    private activated: ActivatedRoute,
    private cartservice: CartService,

    private sanitizer: DomSanitizer
  ) {}

  userDetail: any;
  roleList: any;
  userId: any;
  title: any;
  selectedFiles: any = [];
  isSubmit: boolean = false;
  delFile: any = [];
  profileImgList: any;
  imageBlobUrl: any;
  ImageList: any = [];

  updateForm = this.formBuilder.group({
    fristName: '',
    lastName: '',
    phone: '',
    age: '',
    roleId: '',
    userName: '',
    files: [],
    password: '',
  });

  ngOnInit() {
    this.getAllRole();
    this.cartservice.getProduct();

    this.userId = this.activated.snapshot.paramMap.get('userId');
    if (this.userId) {
      this.callService.getByUserId(this.userId).subscribe((res) => {
        if (res.data) {
          this.title = 'Your Profile User';
          this.userDetail = res.data;
          this.setDataForm(this.userDetail);
        }
      });
    } else {
      this.title = 'Your Profile Login';
      let userDetailSession: any = sessionStorage.getItem('userDetail');
      this.userDetail = JSON.parse(userDetailSession);
      this.setDataForm(this.userDetail);
      this.userId = this.userDetail.userId; // Set userId from session storage

      // ดึงภาพ
      this.callService
        .getProfileImgByUserId(this.userDetail.userId)
        .subscribe((res) => {
          if (res.data) {
            this.profileImgList = res.data;
            for (let profileImg of this.profileImgList) {
              this.getImage(profileImg.profileImgName);
            }
          } else {
            window.location.reload();
          }
        });
    }
  }
  getImage(fileNames: any) {
    this.callService.getProfileImageByte(fileNames).subscribe((res) => {
      let objectURL = URL.createObjectURL(res);
      this.imageBlobUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
      this.ImageList.push({
        key: fileNames,
        value: this.imageBlobUrl,
      });
    });
  }
  setDataForm(data: any) {
    this.updateForm.patchValue({
      fristName: data.fristName,
      lastName: data.lastName,
      phone: data.phone,
      age: data.age,
      roleId: data.roleId,
      userName: data.userName,
      password: data.password,
    });
  }

  getAllRole() {
    this.callService.getAllRole().subscribe((res) => {
      if (res) {
        this.roleList = res;
      }
    });
  }

  onSubmit() {
    console.log(this.updateForm.value);

    const data = this.updateForm.value;

    this.callService
      .updateProfile(data, this.userDetail.userId)
      .subscribe((res) => {
        if (res.data) {
          if (this.delFile) {
            for (let fileName of this.delFile) {
              this.callService.deleteProfileImage(fileName).subscribe((res) => {
                console.log('deleteImage =>');
              });
            }
          }

          if (this.selectedFiles[0]) {
            for (const file of this.selectedFiles[0]) {
              const formData = new FormData();
              formData.append('file', file);
              this.callService
                .saveProfileImgUserId(formData, res.data)
                .subscribe((res) => {
                  console.log('saveImage=>', res.data);
                });
            }
          }
          if (res.data) {
            Swal.fire({
              icon: 'success',
              title: 'สำเร็จ!',
              text: 'บันทึกข้อมูลสำเร็จ',
              confirmButtonText: 'ตกลง',
            }).then((res) => {
              if (res.isConfirmed) {
                // this.router.navigate(['/profile']);
                this.getUserById(this.userDetail.userId);
                // window.location.reload();
              }
            });
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'บันทึกไม่สำเร็จ!',
              text: 'กรุณาตรวจสอบข้อมูล ด้วยค่ะ',
              confirmButtonText: 'ตกลง',
            });
          }
        }
      });
  }

  getUserById(userId: any) {
    this.callService.getByUserId(userId).subscribe((res) => {
      if (res.data) {
        this.setDataForm(res.data);
        sessionStorage.removeItem('userDetail');
        sessionStorage.setItem('userDetail', JSON.stringify(res.data));
        // อัปเดตหน้าโปรไฟล์ด้วยข้อมูลที่อัปเดตใหม่
        this.userDetail = res.data;
      }
    });
  }

  onFileChanged(event: any) {
    this.selectedFiles.push(event.target.files);
  }
  onKeyPrice(event: any) {
    console.log('event=>', event.target.result);
    return parseFloat(event.target.result).toFixed(2);
  }

  validator() {
    if (this.updateForm.valid) {
      return true;
    } else {
      return false;
    }
  }

  setSubmit() {
    this.isSubmit = false;
  }
  onDeleteFileChanged(fileName: any) {
    let dataList = [];
    for (let image of this.ImageList) {
      if (image.key != fileName) {
        dataList.push(image);
      } else {
        this.delFile.push(image.key);
      }
    }
    this.ImageList = dataList;
    console.log(' this.delFile', this.delFile);
  }
}
