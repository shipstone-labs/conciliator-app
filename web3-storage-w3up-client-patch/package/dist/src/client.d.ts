export * as Access from "./capability/access.js";
export class Client extends Base {
    capability: {
        access: AccessClient;
        filecoin: FilecoinClient;
        index: IndexClient;
        plan: PlanClient;
        space: SpaceClient;
        blob: BlobClient;
        store: StoreClient;
        subscription: SubscriptionClient;
        upload: UploadClient;
        usage: UsageClient;
    };
    coupon: CouponAPI;
    did(): `did:key:${string}`;
    /**
     * @deprecated - Use client.login instead.
     *
     * Authorize the current agent to use capabilities granted to the passed
     * email account.
     *
     * @param {`${string}@${string}`} email
     * @param {object} [options]
     * @param {AbortSignal} [options.signal]
     * @param {Iterable<{ can: import('./types.js').Ability }>} [options.capabilities]
     */
    authorize(email: `${string}@${string}`, options?: {
        signal?: AbortSignal | undefined;
        capabilities?: Iterable<{
            can: import('./types.js').Ability;
        }> | undefined;
    } | undefined): Promise<void>;
    /**
     * @param {Account.EmailAddress} email
     * @param {object} [options]
     * @param {AbortSignal} [options.signal]
     */
    login(email: Account.EmailAddress, options?: {
        signal?: AbortSignal | undefined;
    } | undefined): Promise<Account.Account>;
    /**
     * List all accounts that agent has stored access to.
     *
     * @returns {Record<DIDMailto, Account>} A dictionary with `did:mailto` as keys and `Account` instances as values.
     */
    accounts(): Record<typeof DIDMailto, typeof Account>;
    /**
     * Uploads a file to the service and returns the root data CID for the
     * generated DAG.
     *
     * Required delegated capabilities:
     * - `filecoin/offer`
     * - `space/blob/add`
     * - `space/index/add`
     * - `upload/add`
     *
     * @param {import('./types.js').BlobLike} file - File data.
     * @param {import('./types.js').UploadFileOptions} [options]
     */
    uploadFile(file: import('./types.js').BlobLike, options?: import("@web3-storage/upload-client/types").UploadFileOptions | undefined): Promise<import("@web3-storage/upload-client/types").AnyLink>;
    /**
     * Uploads a directory of files to the service and returns the root data CID
     * for the generated DAG. All files are added to a container directory, with
     * paths in the file names preserved.
     *
     * Required delegated capabilities:
     * - `filecoin/offer`
     * - `space/blob/add`
     * - `space/index/add`
     * - `upload/add`
     *
     * @param {import('./types.js').FileLike[]} files - File data.
     * @param {import('./types.js').UploadDirectoryOptions} [options]
     */
    uploadDirectory(files: import('./types.js').FileLike[], options?: import("@web3-storage/upload-client/types").UploadDirectoryOptions | undefined): Promise<import("@web3-storage/upload-client/types").AnyLink>;
    /**
     * Uploads a CAR file to the service.
     *
     * The difference between this function and `capability.blob.add` is that
     * the CAR file is automatically sharded, an index is generated, uploaded and
     * registered (see `capability.index.add`) and finally an an "upload" is
     * registered, linking the individual shards (see `capability.upload.add`).
     *
     * Use the `onShardStored` callback to obtain the CIDs of the CAR file shards.
     *
     * Required delegated capabilities:
     * - `filecoin/offer`
     * - `space/blob/add`
     * - `space/index/add`
     * - `upload/add`
     *
     * @param {import('./types.js').BlobLike} car - CAR file.
     * @param {import('./types.js').UploadOptions} [options]
     */
    uploadCAR(car: import('./types.js').BlobLike, options?: import("@web3-storage/upload-client/types").UploadOptions | undefined): Promise<import("@web3-storage/upload-client/types").AnyLink>;
    /**
     * Get a receipt for an executed task by its CID.
     *
     * @param {import('multiformats').UnknownLink} taskCid
     */
    getReceipt(taskCid: import('multiformats').UnknownLink): Promise<UcantoClient.Receipt<{}, {}, UcantoClient.Invocation<UcantoClient.Capability<UcantoClient.Ability, `${string}:${string}`, unknown>>, UcantoClient.SigAlg>>;
    /**
     * Return the default provider.
     */
    defaultProvider(): `did:${string}:${string}`;
    /**
     * The current space.
     */
    currentSpace(): Space | undefined;
    /**
     * Use a specific space.
     *
     * @param {import('./types.js').DID} did
     */
    setCurrentSpace(did: import('./types.js').DID): Promise<void>;
    /**
     * Spaces available to this agent.
     */
    spaces(): Space[];
    /**
     * Creates a new space with a given name.
     * If an account is not provided, the space is created without any delegation and is not saved, hence it is a temporary space.
     * When an account is provided in the options argument, then it creates a delegated recovery account
     * by provisioning the space, saving it and then delegating access to the recovery account.
     * In addition, it authorizes the listed Gateway Services to serve content from the created space.
     * It is done by delegating the `space/content/serve/*` capability to the Gateway Service.
     * User can skip the Gateway authorization by setting the `skipGatewayAuthorization` option to `true`.
     * If no gateways are specified or the `skipGatewayAuthorization` flag is not set, the client will automatically grant access
     * to the Storacha Gateway by default (https://freewaying.dag.haus/).
     *
     * @typedef {import('./types.js').ConnectionView<import('./types.js').ContentServeService>} ConnectionView
     *
     * @typedef {object} SpaceCreateOptions
     * @property {Account.Account} [account] - The account configured as the recovery account for the space.
     * @property {Array<ConnectionView>} [authorizeGatewayServices] - The DID Key or DID Web of the Gateway to authorize to serve content from the created space.
     * @property {boolean} [skipGatewayAuthorization] - Whether to skip the Gateway authorization. It means that the content of the space will not be served by any Gateway.
     *
     * @param {string} name - The name of the space to create.
     * @param {SpaceCreateOptions} [options] - Options for the space creation.
     * @returns {Promise<import("./space.js").OwnedSpace>} The created space owned by the agent.
     */
    createSpace(name: string, options?: {
        /**
         * - The account configured as the recovery account for the space.
         */
        account?: Account.Account | undefined;
        /**
         * - The DID Key or DID Web of the Gateway to authorize to serve content from the created space.
         */
        authorizeGatewayServices?: UcantoClient.ConnectionView<import("./types.js").ContentServeService>[] | undefined;
        /**
         * - Whether to skip the Gateway authorization. It means that the content of the space will not be served by any Gateway.
         */
        skipGatewayAuthorization?: boolean | undefined;
    } | undefined): Promise<import("./space.js").OwnedSpace>;
    /**
     * Share an existing space with another Storacha account via email address delegation.
     * Delegates access to the space to the specified email account with the following permissions:
     * - space/* - for managing space metadata
     * - blob/* - for managing blobs
     * - store/* - for managing stores
     * - upload/*- for registering uploads
     * - access/* - for re-delegating access to other devices
     * - filecoin/* - for submitting to the filecoin pipeline
     * - usage/* - for querying usage
     * The default expiration is set to infinity.
     *
     * @typedef {object} ShareOptions
     * @property {import('./types.js').ServiceAbility[]} abilities - Abilities to delegate to the delegate account.
     * @property {number} expiration - Expiration time in seconds.
     
     * @param {import("./types.js").EmailAddress} delegateEmail - Email of the account to share the space with.
     * @param {import('./types.js').SpaceDID} spaceDID - The DID of the space to share.
     * @param {ShareOptions} [options] - Options for the delegation.
     *
     * @returns {Promise<import('./delegation.js').AgentDelegation<any>>} Resolves with the AgentDelegation instance once the space is successfully shared.
     * @throws {Error} - Throws an error if there is an issue delegating access to the space.
     */
    shareSpace(delegateEmail: import("./types.js").EmailAddress, spaceDID: import('./types.js').SpaceDID, options?: {
        /**
         * - Abilities to delegate to the delegate account.
         */
        abilities: import('./types.js').ServiceAbility[];
        /**
         * - Expiration time in seconds.
         */
        expiration: number;
    } | undefined): Promise<import('./delegation.js').AgentDelegation<any>>;
    /**
     * Add a space from a received proof.
     *
     * @param {import('./types.js').Delegation} proof
     */
    addSpace(proof: import('./types.js').Delegation): Promise<import("@web3-storage/access").SharedSpace>;
    /**
     * Get all the proofs matching the capabilities.
     *
     * Proofs are delegations with an _audience_ matching the agent DID.
     *
     * @param {import('./types.js').Capability[]} [caps] - Capabilities to
     * filter by. Empty or undefined caps with return all the proofs.
     */
    proofs(caps?: UcantoClient.Capability<UcantoClient.Ability, `${string}:${string}`, any>[] | undefined): UcantoClient.Delegation<UcantoClient.Capabilities>[];
    /**
     * Add a proof to the agent. Proofs are delegations with an _audience_
     * matching the agent DID.
     *
     * @param {import('./types.js').Delegation} proof
     */
    addProof(proof: import('./types.js').Delegation): Promise<void>;
    /**
     * Get delegations created by the agent for others.
     *
     * @param {import('./types.js').Capability[]} [caps] - Capabilities to
     * filter by. Empty or undefined caps with return all the delegations.
     */
    delegations(caps?: UcantoClient.Capability<UcantoClient.Ability, `${string}:${string}`, any>[] | undefined): AgentDelegation<UcantoClient.Capabilities>[];
    /**
     * Create a delegation to the passed audience for the given abilities with
     * the _current_ space as the resource.
     *
     * @param {import('./types.js').Principal} audience
     * @param {import('./types.js').ServiceAbility[]} abilities
     * @param {Omit<import('./types.js').UCANOptions, 'audience'> & { audienceMeta?: import('./types.js').AgentMeta }} [options]
     */
    createDelegation(audience: import('./types.js').Principal, abilities: import('./types.js').ServiceAbility[], options?: (Omit<UcantoClient.UCANOptions, "audience"> & {
        audienceMeta?: import("@web3-storage/access").AgentMeta | undefined;
    }) | undefined): Promise<AgentDelegation<UcantoClient.Capabilities>>;
    /**
     * Revoke a delegation by CID.
     *
     * If the delegation was issued by this agent (and therefore is stored in the
     * delegation store) you can just pass the CID. If not, or if the current agent's
     * delegation store no longer contains the delegation, you MUST pass a chain of
     * proofs that proves your authority to revoke this delegation as `options.proofs`.
     *
     * @param {import('@ucanto/interface').UCANLink} delegationCID
     * @param {object} [options]
     * @param {import('@ucanto/interface').Delegation[]} [options.proofs]
     */
    revokeDelegation(delegationCID: import('@ucanto/interface').UCANLink, options?: {
        proofs?: UcantoClient.Delegation<UcantoClient.Capabilities>[] | undefined;
    } | undefined): Promise<BlobCapabilities.Schema.Result<{}, BlobCapabilities.Schema.Error | UcantoClient.HandlerNotFound | UcantoClient.HandlerExecutionError | UcantoClient.InvalidAudience | UcantoClient.Unauthorized>>;
    /**
     * Removes association of a content CID with the space. Optionally, also removes
     * association of CAR shards with space.
     *
     * ⚠️ If `shards` option is `true` all shards will be deleted even if there is another upload(s) that
     * reference same shards, which in turn could corrupt those uploads.
     *
     * Required delegated capabilities:
     * - `space/blob/remove`
     * - `store/remove`
     * - `upload/get`
     * - `upload/remove`
     *
     * @param {import('multiformats').UnknownLink} contentCID
     * @param {object} [options]
     * @param {boolean} [options.shards]
     */
    remove(contentCID: import('multiformats').UnknownLink, options?: {
        shards?: boolean | undefined;
    } | undefined): Promise<void>;
}
export function authorizeContentServe(client: Client, space: import('./types.js').OwnedSpace, connection: import('./types.js').ConnectionView<import('./types.js').ContentServeService>, options?: {
    audience?: `did:${string}:${string}` | undefined;
    expiration?: number | undefined;
} | undefined): Promise<{
    ok: {
        delegation: AgentDelegation<UcantoClient.Capabilities>;
    };
}>;
import { AccessClient } from './capability/access.js';
import { BlobClient } from './capability/blob.js';
import { FilecoinClient } from './capability/filecoin.js';
import { IndexClient } from './capability/index.js';
import { PlanClient } from './capability/plan.js';
import { StoreClient } from './capability/store.js';
import { SpaceClient } from './capability/space.js';
import { SubscriptionClient } from './capability/subscription.js';
import { UploadClient } from './capability/upload.js';
import { UsageClient } from './capability/usage.js';
import { Base } from './base.js';
import { CouponAPI } from './coupon.js';
import * as Account from './account.js';
import * as DIDMailto from '@web3-storage/did-mailto';
import * as UcantoClient from '@ucanto/client';
import { Space } from './space.js';
import { AgentDelegation } from './delegation.js';
import { Blob as BlobCapabilities } from '@web3-storage/capabilities';
export { AccessClient, BlobClient, FilecoinClient, IndexClient, PlanClient, StoreClient, SpaceClient, SubscriptionClient, UploadClient, UsageClient };
//# sourceMappingURL=client.d.ts.map