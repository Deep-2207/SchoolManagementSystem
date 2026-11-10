import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserindexComponent } from './userindex/userindex.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserExamComponent } from './user-exam/user-exam.component';
import { UserGradesComponent } from './user-grades/user-grades.component';
import { UserLiveClassComponent } from './user-live-class/user-live-class.component';


@NgModule({
    imports: [RouterModule.forChild([
        { path: 'index', component:UserindexComponent },
        { path: 'dashboard', component:DashboardComponent },
        { path: 'exam/:id', component: UserExamComponent },
        { path: 'grades', component: UserGradesComponent },
        { path: 'live-class', component: UserLiveClassComponent },
        { path: 'live-class/:id', component: UserLiveClassComponent },
    ])],
    exports: [RouterModule]
})
export class UserRoutingModule{

}