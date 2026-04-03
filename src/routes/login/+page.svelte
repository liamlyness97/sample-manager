<script lang="ts">
	let selectedForm = $state('login');
</script>

<div class="flex h-screen w-full items-center justify-center bg-offWhite">
	<div class="mx-auto flex w-1/3 flex-col items-center">
		{#if selectedForm == 'login'}
			<div class="flex w-full flex-col gap-4 bg-white p-8">
				<p class="pb-4 text-3xl font-bold">Login</p>
				<form action="?/login" method="POST" class="flex flex-col gap-2">
					<label for="Name" class="text-sm font-bold"
						>Email Address
						<input
							type="email"
							name="email"
							id="email"
							class="mt-1 w-full rounded border border-blue p-2 text-base"
						/>
					</label>
					<label for="Name" class="text-sm font-bold"
						>Password
						<input
							type="password"
							name="password"
							id="password"
							class="mt-1 w-full rounded border border-blue p-2 text-base"
						/>
					</label>
					<button type="submit" class="mt-4 rounded bg-blue p-2 text-white">Login</button>
				</form>
				<button
					onclick={() => {
						selectedForm = 'signup';
					}}
					class="-mt-2 cursor-pointer text-sm text-blue duration-200 ease-out hover:opacity-75"
					>Or Signup</button
				>
			</div>
		{/if}
		{#if selectedForm == 'signup'}
			<div class="flex w-full flex-col gap-4 bg-white p-8">
				<p class="pb-4 text-3xl font-bold">Signup</p>
				<form action="?/signup" method="POST" class="flex flex-col gap-2">
					<label for="Name" class="text-sm font-bold"
						>Full Name
						<input
							type="text"
							name="name"
							id="name"
							class="mt-1 w-full rounded border border-blue p-2 text-base"
						/>
					</label>
					<label for="Name" class="text-sm font-bold"
						>Email Address
						<input
							type="email"
							name="email"
							id="email"
							class="mt-1 w-full rounded border border-blue p-2 text-base"
						/>
					</label>
					<label for="Name" class="text-sm font-bold"
						>Password
						<input
							type="password"
							name="password"
							id="password"
							class="mt-1 w-full rounded border border-blue p-2 text-base"
						/>
					</label>
					<button type="submit" class="mt-4 rounded bg-blue p-2 text-white">Signup</button>
				</form>
				<button
					onclick={() => {
						selectedForm = 'login';
					}}
					class="-mt-2 cursor-pointer text-sm text-blue duration-200 ease-out hover:opacity-75"
					>Or Login</button
				>
			</div>
		{/if}
	</div>
</div>
