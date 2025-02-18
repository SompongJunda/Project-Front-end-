import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from './component/sidebar/sidebar.component';

import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderComponent } from './component/header/header.component';
import { FooterComponent } from './component/footer/footer.component';

@NgModule({
  imports: [CommonModule, RouterModule, FlexLayoutModule],
  declarations: [HeaderComponent, SidebarComponent, FooterComponent],
  exports: [HeaderComponent, SidebarComponent, FooterComponent],
})
export class SharedModule {}
