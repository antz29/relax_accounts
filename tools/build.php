<?php

class JsBuilder {

	private $_target_base_path;
	private $_target_base_public;

	private $_unresolved = array();
	private $_packages = array();

	public function setTargetBase($path,$public)
	{
		$this->_target_base_path = realpath($path);
		$this->_target_base_public = $public;
	}

	public function hasPackage($name)
	{
		return isset($this->_packages[$name]);
	}

	public function addPackage($name,$target=null,$file=null) 
	{
		if (isset($target)) $this->_packages[$name]['target'] = $target;

		$this->_packages[$name]['name'] = $name;
		$this->_packages[$name]['files'] = isset($this->_packages[$name]['files']) ? $this->_packages[$name]['files'] : array();

		if (isset($file)) {
			$this->_packages[$name]['files'][] = $file;
			if (isset($this->_unresolved[$file])) {
				$deps = array_unique($this->_unresolved[$file]);
				foreach ($deps as $dep) {
					$this->addDependency($name,$dep);
				}
				unset($this->_unresolved[$file]);
			}
		}
	}	

	public function addUnresolvedDep($file,$package) 
	{
		$this->_unresolved[$file][] = $package;
	}

	public function addDependency($name,$depends_on) 
	{
		$async = true;
		if (substr($depends_on,0,1) == '!') {
			$async = false;
			$depends_on = substr($depends_on,1);
		}

		if (!$this->hasPackage($name)) $this->addPackage($name);
		if (!$this->hasPackage($depends_on)) $this->addPackage($depends_on);

		$this->_packages[$name]['deps'] = isset($this->_packages[$name]['deps']) ? $this->_packages[$name]['deps'] : array();

		if ($async) {
			$this->_packages[$name]['deps']['async'][$depends_on] = $depends_on;
		}
		else {
			$this->_packages[$name]['deps']['sync'][$depends_on] = $depends_on;
		}		
	}

	public function addDir($path,$target) 
	{
		$path = realpath($path);
		if (!$path) return false;

		$dir = new RecursiveDirectoryIterator($path);
		$it = new RecursiveIteratorIterator($dir);
		$rit = new RegexIterator($it, '/^.+\.js$/i', RecursiveRegexIterator::GET_MATCH);

		$files = array();	
		foreach ($rit as $file) {
			$file = realpath($file[0]);
			$data = file_get_contents($file,false,null,0,500);	
			preg_match_all('!#([A-Z]+)\:([a-z\\.,\!\040]*)!i',$data,$matches,PREG_SET_ORDER);
			$this_package = false;

			foreach ($matches as $match) {		
				$tag = trim($match[1]);
				$packages = explode(',',trim($match[2]));	
				$packages = array_map(function($val){ return trim($val); },$packages);

				switch ($tag) {
					case 'PROVIDES':
						$this->addPackage($packages[0],$target,$file);
						$this_package = $packages[0];
						break;
					case 'DEPENDS':
						foreach ($packages as $package) {
							if ($this_package) {
								$this->addDependency($this_package,$package);
							}
							else {
								$this->addUnresolvedDep($file,$package);
							}
						}	
						break;				
				}
			} 
		}

		return true;
	}

	public function getPackage($name) {
		return isset($this->_packages[$name]) ? $this->_packages[$name] : false;
	}

	public function buildPackage($package) {
		if (!is_array($package)) {
			if (!$package = $this->getPackage($package)) return false;		
		}
		$files = array_map(function($val) { return file_get_contents($val); },$package['files']);
		return implode("\n\n",$files);
	}

	public function renderDev() {
		foreach ($this->_packages as $name => $package) {
				
		}
	}

	private function renderRule($name,$target,$mode)
	{
		$package = $this->getPackage($name);

		$sync = "";
		if (isset($package['deps']['sync'])) 
		{
			$sync = implode(' > ',$package['deps']['sync']);
			$sync = "( {$sync} )";
		}
		
		$async = "";
		if (isset($package['deps']['async'])) 
		{
			$async = implode(' ',$package['deps']['async']);
			$async = "( {$async} )";
		}

		$deps = ($sync || $async) ? "( {$sync} {$async} ) > " : "";

		switch ($mode) {
			case 'prod':
				$file = "{$this->_target_base_public}/{$target}.js";
				break;

			case 'dev':
				$file = "{$this->_target_base_public}/{$target}/{$name}.js";
				break;
		}

		$rule = "( {$deps}{$file} )";

		return "dominoes.rule('{$name}','{$rule}');";
	}

	public function renderRules($mode) {
		$rules = array();

		foreach ($this->_packages as $name => $package) 
		{
			if (!isset($package['target'])) continue;
			$rules[] = $this->renderRule($name,$package['target'],$mode);
		}

		return implode("\n",$rules);
	}

	public function build($mode) {
		$targets = array();
		foreach ($this->_packages as $name => $package) {
			if (!isset($package['target'])) continue;
			$targets[$package['target']][$name] = $package;
		}
		foreach ($targets as $target => $packages) {
			switch ($mode) {
				case 'prod':				
					uasort ($packages, function($a,$b) {
						if (isset($a['deps']) && !isset($b['deps'])) return 1;
						if (!isset($a['deps']) && !isset($b['deps'])) return 0;
						if (isset($a['deps']) && isset($b['deps'])) {
							if (isset($a['deps']['sync'][$b['name']]) || isset($a['deps']['async'][$b['name']])) return 1;
							if (isset($b['deps']['sync'][$a['name']]) || isset($b['deps']['async'][$a['name']])) return -1;
							return 0;
						}	
						if (!isset($a['deps']) && isset($b['deps'])) return -1;
					});
					$that = $this;
					$packages = array_map(function($package) use ($that) {
						return $that->buildPackage($package);
					},$packages);
					file_put_contents($this->_target_base_path."/{$target}.js",implode("\n\n",$packages));
				break;
				case 'dev':
					mkdir($this->_target_base_path."/{$target}");
					foreach ($packages as $package) {
						file_put_contents($this->_target_base_path."/{$target}/{$package['name']}.js",$this->buildPackage($package));
					}
					break;
			}
		}
		file_put_contents($this->_target_base_path.'/init.js',$this->renderRules($mode));
	}

}

array_shift($argv);
$mode = array_shift($argv);

$target_public = array_pop($argv);
$target_path = realpath(array_pop($argv));

$paths = array_map(function($val) { 
	$val = explode(':',$val,2);
	return array(
		'target' => trim($val[0]),
		'path' => realpath($val[1])
	);
},$argv);

$jsb = new JsBuilder();

$jsb->setTargetBase($target_path, $target_public);

foreach ($paths as $dir) {
	$jsb->addDir($dir['path'],$dir['target']);
}

echo "Bulding JS packages and generating rules...";
$jsb->build($mode);
