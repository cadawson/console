/* Copyright Contributors to the Open Cluster Management project */
import {
    Button,
    ButtonVariant,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Stack,
} from '@patternfly/react-core'
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons'
import { AcmTable } from '@stolostron/ui-components'
import moment from 'moment'
import { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { ansibleJobState, secretsState } from '../../../atoms'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import { AnsibleJob, deleteResource, Policy, PolicyAutomation, Secret } from '../../../resources'
import { ClusterPolicyViolationIcons } from '../components/ClusterPolicyViolations'
import { useGovernanceData } from '../useGovernanceData'

export interface JobTableData {
    name: string
    namespace: string
    status: string
    started: string
    finished: string
}

export function AutomationDetailsSidebar(props: {
    policyAutomationMatch: PolicyAutomation
    policy: Policy
    onClose: () => void
}) {
    const { policyAutomationMatch, policy, onClose } = props
    const { t } = useTranslation()
    const history = useHistory()
    const [ansibleJobs] = useRecoilState(ansibleJobState)
    const [secrets] = useRecoilState(secretsState)
    const govData = useGovernanceData([policy])
    const clusterRiskScore =
        govData.clusterRisks.high +
        govData.clusterRisks.medium +
        govData.clusterRisks.low +
        govData.clusterRisks.unknown +
        govData.clusterRisks.synced

    const credential = useMemo(
        () =>
            secrets.filter(
                (secret: Secret) =>
                    secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
                    secret.metadata.name === policyAutomationMatch.spec.automationDef.secret
            ),
        [policyAutomationMatch, secrets]
    )

    const towerURL = useMemo(
        () => (credential[0] ? Buffer.from(credential[0]?.data!.host, 'base64').toString('ascii') : '-'),
        [credential]
    )

    const jobItems = useMemo(
        () =>
            ansibleJobs
                .filter((job: AnsibleJob) => {
                    const {
                        metadata: { ownerReferences },
                    } = job
                    if (!ownerReferences) {
                        return false
                    }
                    const matched = ownerReferences.find(
                        (or) =>
                            or.apiVersion === 'policy.open-cluster-management.io/v1beta1' &&
                            or.kind === 'PolicyAutomation' &&
                            or.name === policyAutomationMatch.metadata.name
                    )
                    return matched !== undefined
                })
                .map((job: AnsibleJob) => {
                    const jobResult = job.status?.ansibleJobResult
                    const conditions = job.status?.conditions
                    const ansibleResultCondition = conditions?.find((arc) => arc.ansibleResult)
                    return {
                        name: job.metadata.name!,
                        namespace: job.metadata.namespace!,
                        status: jobResult?.status ?? 'No status',
                        started: jobResult?.started
                            ? moment(new Date(jobResult?.started)).fromNow()
                            : moment(new Date(ansibleResultCondition?.lastTransitionTime ?? '')).fromNow(),
                        finished: jobResult?.finished
                            ? moment(new Date(jobResult?.finished)).fromNow()
                            : moment(new Date(ansibleResultCondition?.lastTransitionTime ?? '')).fromNow(),
                    }
                }),
        [ansibleJobs, policyAutomationMatch.metadata.name]
    )

    const jobCols = useMemo(
        () => [
            {
                header: 'Status',
                cell: (item: JobTableData) => {
                    let ansibleJobStatus = item.status
                    ansibleJobStatus =
                        ansibleJobStatus && typeof ansibleJobStatus === 'string'
                            ? ansibleJobStatus.trim().toLowerCase()
                            : '-'
                    switch (ansibleJobStatus) {
                        case 'successful':
                            return (
                                <div>
                                    <CheckCircleIcon color="var(--pf-global--success-color--100)" /> {'Successful'}
                                </div>
                            )
                        case 'error':
                        case 'failed':
                            return (
                                <div>
                                    <ExclamationCircleIcon color="var(--pf-global--danger-color--100)" /> {'Failed'}
                                </div>
                            )
                        case '-':
                            return (
                                <div>
                                    <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                                    {'No status'}
                                </div>
                            )
                        default:
                            return (
                                <div>
                                    <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                                    {'No status'}
                                </div>
                            )
                    }
                },
                sort: 'status',
            },
            {
                header: 'Started',
                cell: 'started',
                sort: 'started',
            },
            {
                header: 'Finished',
                cell: 'finished',
                sort: 'finished',
            },
            {
                header: '',
                cell: (item: JobTableData) => (
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`${NavigationPath.search}?filters={%22textsearch%22:%22cluster%3Alocal-cluster%20kind%3Aansiblejob%20namespace%3A${item.namespace}%20name%3A${item.name}%22}`}
                    >
                        {'View job'}
                    </a>
                ),
            },
        ],
        []
    )

    return (
        <div>
            <Stack hasGutter>
                <DescriptionList>
                    <DescriptionListGroup>
                        <DescriptionListTerm>
                            <strong>{t('Policy name')}</strong>
                        </DescriptionListTerm>
                        <DescriptionListDescription>{policyAutomationMatch.spec.policyRef}</DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                        <DescriptionListTerm>
                            <strong>{t('Cluster violations')}</strong>
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                            {clusterRiskScore > 0 ? (
                                <ClusterPolicyViolationIcons risks={govData.clusterRisks} />
                            ) : (
                                <div>
                                    <ExclamationTriangleIcon color="var(--pf-global--warning-color--100)" />{' '}
                                    {'No status'}
                                </div>
                            )}
                        </DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                        <DescriptionListTerm>
                            <strong>{t('Ansible tower URL')}</strong>
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                            <Button isInline variant={ButtonVariant.link} href={towerURL}>
                                {towerURL}
                            </Button>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </Stack>
            <AcmTable<JobTableData>
                key="ansible-job-history"
                plural={'ansible jobs'}
                items={jobItems}
                columns={jobCols}
                keyFn={(item) => item.name}
                autoHidePagination={true}
                initialSort={{
                    index: 1,
                    direction: 'desc',
                }}
            />
            <div style={{ display: 'flex', position: 'fixed', bottom: 0, padding: '1rem 0' }}>
                <Button
                    variant="primary"
                    onClick={() =>
                        history.push(
                            NavigationPath.editPolicyAutomation
                                .replace(':namespace', policy.metadata.namespace as string)
                                .replace(':name', policy.metadata.name as string)
                        )
                    }
                >
                    {'Edit'}
                </Button>
                {/* 16px is standard pf button spacing */}
                <div style={{ width: '16px' }} />
                <Button variant="secondary" onClick={onClose}>
                    {'Cancel'}
                </Button>
                {/* 16px is standard pf button spacing */}
                <div style={{ width: '16px' }} />
                <Button
                    variant="danger"
                    onClick={() => {
                        deleteResource(policyAutomationMatch)
                        onClose()
                    }}
                >
                    {'Delete'}
                </Button>
            </div>
        </div>
    )
}
