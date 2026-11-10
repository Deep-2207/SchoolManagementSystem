import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { LayoutService } from './service/app.layout.service';
import { MenuDataService } from './service/menudata.service';
import { UserModel } from '../demo/components/auth/user.model';
import { AuthService } from '../demo/components/auth/auth.service';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {
    
    constructor(public layoutService: LayoutService, public menudataService: MenuDataService, private authService: AuthService) { }

    model: any[] = [];
    menuData: any[];
    user: UserModel | null = null;

    ngOnInit() {
        this.authService.user.subscribe(user => {
            this.user = user;
            this.buildMenu();
        });
    }

    buildMenu() {
        this.model = [];
        if (!this.user) return;

        let menuObservable;
        if (this.user.isSuperAdmin) {
            menuObservable = this.menudataService.getAdminMenu();
        } else if (this.user.isTeacher || this.user.isAdmin) {
            menuObservable = this.menudataService.getTeacherMenu();
        } else {
            menuObservable = this.menudataService.getUserMenu();
        }

        menuObservable.subscribe(data => {
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                let mainMenu = { items: [], label: element.label };
                for (let y = 0; y < element.items.length; y++) {
                    const subElement = element.items[y];
                    mainMenu.items.push({
                        label: subElement.label,
                        icon: subElement.icon,
                        routerLink: [subElement.routerLink]
                    });
                }
                this.model.push(mainMenu);
            }
        });
    }
}
