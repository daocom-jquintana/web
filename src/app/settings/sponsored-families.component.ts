import {
    Component,
    OnInit,
} from '@angular/core';
import { ToasterService } from 'angular2-toaster';
import { ApiService } from 'jslib-common/abstractions/api.service';
import { I18nService } from 'jslib-common/abstractions/i18n.service';
import { LogService } from 'jslib-common/abstractions/log.service';
import { PlatformUtilsService } from 'jslib-common/abstractions/platformUtils.service';
import { SyncService } from 'jslib-common/abstractions/sync.service';
import { UserService } from 'jslib-common/abstractions/user.service';
import { PlanSponsorshipType } from 'jslib-common/enums/planSponsorshipType';
import { Organization } from 'jslib-common/models/domain/organization';

@Component({
    selector: 'app-sponsored-families',
    templateUrl: 'sponsored-families.component.html',
})
export class SponsoredFamiliesComponent implements OnInit {
    availableSponsorshipOrgs: Organization[];
    // TODO: I think this will be a different model
    activeSponsorshipOrgs: Organization[];
    selectedSponsorshipOrgId: string = '';
    sponsorshipEmail: string = '';
    friendlyName: string = '';

    // Conditional display properties
    anyActiveSponsorships: boolean = false;
    moreThanOneOrgAvailable: boolean = false;
    anyOrgsAvailable: boolean = false;

    formPromise: Promise<any>;

    constructor(private userService: UserService, private apiService: ApiService,
        private platformUtilsService: PlatformUtilsService, private i18nService: I18nService,
        private toasterService: ToasterService, private logService: LogService,
        private syncService: SyncService) { }

    async ngOnInit() {
        await this.load();
    }

    async resendEmail(org: Organization) {
        this.toasterService.popAsync('success', null, '[WIP] Should send email');
    }

    async removeSponsorship(org: Organization) {
        const isConfirmed = await this.platformUtilsService.showDialog(
            'Are you sure you want to remove this sponsorship?', org.familySponsorshipFriendlyName,
            this.i18nService.t('yes'), this.i18nService.t('no'), 'warning');
        if (!isConfirmed) {
            return;
        }

        try {
            // TODO: Remove sponsorship
            this.toasterService.popAsync('success', null, '[WIP] Nothing happened');
            this.load();
        } catch (e) {
            this.logService.error(e);
        }

    }

    async submit() {
        this.formPromise = this.apiService.postCreateSponsorship(this.selectedSponsorshipOrgId, {
            sponsoredEmail: this.sponsorshipEmail,
            planSponsorshipType: PlanSponsorshipType.FamiliesForEnterprise,
            friendlyName: this.friendlyName,
        });

        await this.formPromise;
        this.formPromise = null;
        this.load(true);
    }

    private async load(forceReload: boolean = false) {
        if (forceReload) {
            this.syncService.fullSync(true);
        }

        const allOrgs = await this.userService.getAllOrganizations();
        this.availableSponsorshipOrgs = allOrgs.filter(org => org.familySponsorshipAvailable);

        this.activeSponsorshipOrgs = allOrgs.filter(org => org.familySponsorshipFriendlyName !== null);

        if (this.availableSponsorshipOrgs.length > 0) {
            this.anyOrgsAvailable = true;
            this.moreThanOneOrgAvailable = this.availableSponsorshipOrgs.length > 1;

            if (this.availableSponsorshipOrgs.length === 1) {
                this.selectedSponsorshipOrgId = this.availableSponsorshipOrgs[0].id;
            }
        }

        if (this.activeSponsorshipOrgs.length > 0) {
            this.anyActiveSponsorships = true;
        }
    }
}
