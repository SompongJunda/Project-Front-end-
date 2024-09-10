import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataSharingService } from 'src/app/modules/DataSharingService';
import { CartService } from 'src/app/modules/services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  public totalItem: number = 0;
  public userDetail: any;

  constructor(
    private router: Router,
    private dataSharingService: DataSharingService,
    private cartservice: CartService
  ) {
    this.dataSharingService.userDetail.subscribe((value) => {
      var userDetailSession: any = sessionStorage.getItem('userDetail');
      this.userDetail = JSON.parse(userDetailSession);
    });
  }

  ngOnInit(): void {
    this.cartservice.getProduct().subscribe((res) => {
      this.totalItem = res.length;
    });

    var userDetailSession: any = sessionStorage.getItem('userDetail');
    this.userDetail = JSON.parse(userDetailSession);
  }

  logout(): void {
    sessionStorage.removeItem('userDetail');
    this.dataSharingService.userDetail.next(true);
    this.router.navigate(['/login']);
  }
}
